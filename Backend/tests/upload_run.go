// tests/upload_test.go
package tests

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"photovault/config"
	"photovault/models"
)

var orderIndexMu sync.Mutex

func uploadFile(user *models.User, vault *models.Vault, filePath string) error {
	info, err := os.Stat(filePath)
	if err != nil {
		return err
	}

	planMax := int64(1 << 40) // large enough for test uploads
	if user.TotalStorageUsed+info.Size() > planMax {
		return fmt.Errorf("storage limit exceeded")
	}

	// Lock only for order index
	orderIndexMu.Lock()
	var maxIndex int
	config.DB.Model(&models.Upload{}).
		Where("vault_id = ?", vault.ID).
		Select("COALESCE(MAX(order_index),0)").Scan(&maxIndex)

	// Generate unique safe filename & key **before insert**
	safeFilename := strings.ReplaceAll(filepath.Base(filePath), " ", "_")
	key := fmt.Sprintf("vaults/%d/uploads/%s_%s", vault.ID, uuid.NewString(), safeFilename)

	upload := models.Upload{
		VaultID:    vault.ID,
		Filename:   filepath.Base(filePath),
		OrderIndex: maxIndex + 1,
		Size:       info.Size(),
		Key:        key, // already unique
	}

	if err := config.DB.Create(&upload).Error; err != nil {
		orderIndexMu.Unlock()
		return err
	}
	orderIndexMu.Unlock()

	// Read file into memory
	buf := new(bytes.Buffer)
	file, _ := os.Open(filePath)
	if _, err := io.Copy(buf, file); err != nil {
		return err
	}
	file.Close()

	// Upload to R2 with the precomputed key
	_, err = config.R2Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: &config.R2Bucket,
		Key:    &upload.Key,
		Body:   bytes.NewReader(buf.Bytes()),
	})
	if err != nil {
		// Rollback the DB row if upload fails
		config.DB.Delete(&upload)
		return err
	}

	// Update user & vault storage atomically
	config.DB.Model(user).
		UpdateColumn("total_storage_used", gorm.Expr("total_storage_used + ?", info.Size()))
	config.DB.Model(vault).
		UpdateColumn("total_storage_used", gorm.Expr("total_storage_used + ?", info.Size()))

	fmt.Println("Uploaded", filePath)
	return nil
}

// Sequential upload
func sequentialUpload(user *models.User, vault *models.Vault, files []string) {
	for _, f := range files {
		if err := uploadFile(user, vault, f); err != nil {
			log.Println("Error:", err)
		}
	}
}

// Concurrent upload using worker pool
func concurrentUpload(user *models.User, vault *models.Vault, files []string, workers int) {
	fileCh := make(chan string, len(files))
	for _, f := range files {
		fileCh <- f
	}
	close(fileCh)

	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for file := range fileCh {
				if err := uploadFile(user, vault, file); err != nil {
					log.Println("Concurrent error:", err)
				}
			}
		}()
	}
	wg.Wait()
}

// RunUploadTest runs sequential vs concurrent upload for local test files
func RunUploadTest() error {
	var user models.User
	if err := config.DB.First(&user, 1).Error; err != nil {
		return fmt.Errorf("test user not found: %w", err)
	}

	var vault models.Vault
	if err := config.DB.First(&vault, "user_id = ?", user.ID).Error; err != nil {
		return fmt.Errorf("test vault not found: %w", err)
	}

	// Generate file list
	files := []string{}
	for i := 503; i <= 649; i++ {
		files = append(files, fmt.Sprintf("./test_uploads/image_%d.png", i))
	}

	fmt.Println("Starting sequential upload...")
	startSeq := time.Now()
	sequentialUpload(&user, &vault, files)
	seqDuration := time.Since(startSeq)
	fmt.Println("Sequential finished in:", seqDuration)

	fmt.Println("\nStarting concurrent upload...")
	startCon := time.Now()
	concurrentUpload(&user, &vault, files, 10) // 10 workers
	conDuration := time.Since(startCon)
	fmt.Println("Concurrent finished in:", conDuration)

	fmt.Printf("\nSpeedup: %.2fx\n", float64(seqDuration)/float64(conDuration))
	return nil
}
