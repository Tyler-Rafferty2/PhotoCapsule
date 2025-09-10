package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
	"log"
	"fmt"
	"gorm.io/gorm"
	"errors"
	"bytes"
	"context"

	"photovault/config"
	"photovault/models"
	"photovault/utils"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/aws"
)

type UploadResponse struct {
	ID       uint   `json:"id"`
	Filename string `json:"filename"`
	URL      string `json:"url"`
}

type OrderUpdate struct {
	ID         uint `json:"id"`
	OrderIndex int  `json:"order_index"`
}

func UploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	vaultIdStr := strings.TrimPrefix(r.URL.Path, "/upload/")
	vaultId, err := strconv.ParseUint(vaultIdStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid vault ID", http.StatusBadRequest)
		return
	}

	userId, _, err := utils.GetUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var user models.User
	if err := config.DB.First(&user, userId).Error; err != nil {
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}

	var vault models.Vault
	if err := config.DB.First(&vault, vaultId).Error; err != nil || vault.UserID != userId {
		http.Error(w, "Vault not found or forbidden", http.StatusForbidden)
		return
	}

	files := r.MultipartForm.File["images"]

	if len(files) == 0 {
		http.Error(w, "No files uploaded", http.StatusBadRequest)
		return
	}

	for _, handler := range files {

		plan := utils.PlanLimits[user.PlanType]
		log.Printf("here are the things %v + %v > %v",user.TotalStorageUsed,handler.Size,plan.MaxStorage)
		if user.TotalStorageUsed + handler.Size > plan.MaxStorage {
			http.Error(w, "Storage limit exceeded for your plan", http.StatusForbidden)
			return 
		}

		file, err := handler.Open()
		if err != nil {
			http.Error(w, "Error opening file", http.StatusBadRequest)
			return
		}
		file.Close()

		var maxIndex int
		config.DB.Model(&models.Upload{}).
			Where("vault_id = ?", vaultId).
			Select("COALESCE(MAX(order_index), 0)").Scan(&maxIndex)

		upload := models.Upload{
			VaultID:   uint(vaultId),
			Filename:  handler.Filename,
			OrderIndex: maxIndex + 1,
			Size: handler.Size,
		}

		if err := config.DB.Create(&upload).Error; err != nil {
			http.Error(w, "Failed to log upload in DB" + err.Error(), http.StatusInternalServerError)
			return
		}

				// Read the file into memory
		buf := new(bytes.Buffer)
		if _, err := io.Copy(buf, file); err != nil {
			http.Error(w, "Failed to read file", http.StatusInternalServerError)
			return
		}
		file.Close()

		// Upload to R2
		safeFilename := strings.ReplaceAll(handler.Filename, " ", "_")
		key := fmt.Sprintf("vaults/%d/uploads/%d_%s", vaultId, upload.ID, safeFilename)
		_, err = config.R2Client.PutObject(context.TODO(), &s3.PutObjectInput{
			Bucket: &config.R2Bucket,
			Key:    &key,
			Body:   bytes.NewReader(buf.Bytes()),
		})
		if err != nil {
			config.DB.Delete(&upload)
			http.Error(w, "Failed to upload to storage: "+err.Error(), http.StatusInternalServerError)
			return
		}

		upload.Key = key
		if err := config.DB.Save(&upload).Error; err != nil {
			http.Error(w, "Failed to update upload key in DB", http.StatusInternalServerError)
			return
		}

		user.TotalStorageUsed += handler.Size
		if err := config.DB.Save(&user).Error; err != nil {
			http.Error(w, "Failed to update user storage", http.StatusInternalServerError)
			return
		}

		vault.TotalStorageUsed += handler.Size
		if err := config.DB.Save(&vault).Error; err != nil {
			http.Error(w, "Failed to update vault storage", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Upload successful",
	})

}

func ImagesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	vaultIdStr := strings.TrimPrefix(r.URL.Path, "/images/")
	vaultId, err := strconv.ParseUint(vaultIdStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid vault ID", http.StatusBadRequest)
		return
	}

	userId, _, err := utils.GetUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var vault models.Vault
	if err := config.DB.First(&vault, vaultId).Error; err != nil || vault.UserID != userId {
		http.Error(w, "Vault not found or forbidden", http.StatusForbidden)
		return
	}

	uploads := []models.Upload{}
	if err := config.DB.Where("vault_id = ? AND deleted_at IS NULL", vaultId).Find(&uploads).Error; err != nil {
		http.Error(w, "Failed to retrieve uploads", http.StatusInternalServerError)
		return
	}

	responses := []UploadResponse{}
	url := "/image/"
	for _, u := range uploads {
		responses = append(responses, UploadResponse{
			ID:       u.ID,
			Filename: u.Filename,
			URL:	  url + strconv.Itoa(int(u.ID)),
		})
	}
	json.NewEncoder(w).Encode(responses)
}

func GetImageHandler(w http.ResponseWriter, r *http.Request) {
        // 1. Get the logged-in user
		userID, _, err := utils.GetUserFromToken(r)
        if err != nil {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }

        // 2. Get image ID from URL
		vaultIdStr := strings.TrimPrefix(r.URL.Path, "/image/")
		imageID, err := strconv.ParseUint(vaultIdStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid vault ID", http.StatusBadRequest)
			return
		}

        // 3. Look up image in DB
        var img models.Upload
		if err := config.DB.Preload("Vault").First(&img, "id = ?", imageID).Error; err != nil {
            http.Error(w, "Not Found", http.StatusNotFound)
            return
        }

        // 4. Check ownership via Vault
        if img.Vault.UserID != userID {
            http.Error(w, "Forbidden", http.StatusForbidden)
            return
        }

        // if err := config.DB.First(&img, "id = ?", imageID).Error; err != nil {
        //     http.Error(w, "Not Found", http.StatusNotFound)
        //     return
        // }

        // // 4. Check ownership
        // if img. != userID {
        //     http.Error(w, "Forbidden", http.StatusForbidden)
        //     return
        // }

		resp, err := config.R2Client.GetObject(context.TODO(), &s3.GetObjectInput{
			Bucket: &config.R2Bucket,
			Key:    aws.String(img.Key), // fetch from DB
		})
		w.Header().Set("Content-Disposition", "inline; filename="+strconv.Quote(img.Filename))
		if err != nil {
			http.Error(w, "Failed to retrieve file: "+err.Error(), http.StatusInternalServerError)
			return
		}

        // 5. Serve the file
		if _, err := io.Copy(w, resp.Body); err != nil {
			http.Error(w, "Failed to stream file: "+err.Error(), http.StatusInternalServerError)
			return
		}
}


func UpdateOrder(w http.ResponseWriter, r *http.Request) {

	var updates []OrderUpdate
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	for _, update := range updates {
		err := config.DB.Model(&models.Upload{}).
			Where("id = ?", update.ID).
			Update("order_index", update.OrderIndex).Error
		if err != nil {
			http.Error(w, "Failed to update order", http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Order updated successfully",
	})
}

func TrashUpload(w http.ResponseWriter, r *http.Request) {
	
	if r.Method != http.MethodPatch {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/upload/trash/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid upload ID", http.StatusBadRequest)
		return
	}

	var upload models.Upload
	if err := config.DB.First(&upload, id).Error; err != nil {
		http.Error(w, "Upload not found", http.StatusNotFound)
		return
	}

	now := time.Now()
	upload.DeletedAt = &now
	upload.OrderIndex = -1
	if err := config.DB.Save(&upload).Error; err != nil {
		http.Error(w, "Failed to move to trash", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Moved to trash"})
}

func TrashHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("in TrashHandler")
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	vaultIdStr := strings.TrimPrefix(r.URL.Path, "/images/trash/")
	vaultId, err := strconv.ParseUint(vaultIdStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid vault ID", http.StatusBadRequest)
		return
	}

	userId, _, err := utils.GetUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var vault models.Vault
	if err := config.DB.First(&vault, vaultId).Error; err != nil || vault.UserID != userId {
		http.Error(w, "Vault not found or forbidden", http.StatusForbidden)
		return
	}

	uploads := []models.Upload{}
	if err := config.DB.Where("vault_id = ? AND deleted_at IS NOT NULL", vaultId).Find(&uploads).Error; err != nil {
		http.Error(w, "Failed to retrieve uploads", http.StatusInternalServerError)
		return
	}

	responses := []UploadResponse{}
	url := "/image/"
	for _, u := range uploads {
		responses = append(responses, UploadResponse{
			ID:       u.ID,
			Filename: u.Filename,
			URL:	  url + strconv.Itoa(int(u.ID)),
		})
	}
	json.NewEncoder(w).Encode(responses)
}

func TrashDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get logged-in user
	userID, _, err := utils.GetUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse upload ID from URL
	idStr := strings.TrimPrefix(r.URL.Path, "/images/trash/delete/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid upload ID", http.StatusBadRequest)
		return
	}

	// Fetch upload with vault and user
	var upload models.Upload
	err = config.DB.Preload("Vault").Preload("Vault.User").First(&upload, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, "Upload not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Check ownership
	if upload.Vault.UserID != userID {
		http.Error(w, "Forbidden: not your upload", http.StatusForbidden)
		return
	}
	log.Println("HERERERERERERER")
	log.Println(upload)
	log.Println(upload.Size)
	// Decrement user storage
	user := &upload.Vault.User
	user.TotalStorageUsed -= upload.Size
	if user.TotalStorageUsed < 0 {
		user.TotalStorageUsed = 0
	}
	if err := config.DB.Save(user).Error; err != nil {
		http.Error(w, "Failed to update user storage", http.StatusInternalServerError)
		return
	}

	// Decrement vault storage
	vault := &upload.Vault
	vault.TotalStorageUsed -= upload.Size
	if vault.TotalStorageUsed < 0 {
		vault.TotalStorageUsed = 0
	}
	if err := config.DB.Save(vault).Error; err != nil {
		http.Error(w, "Failed to update vault storage", http.StatusInternalServerError)
		return
	}

	// Delete the upload
	if err := config.DB.Delete(&upload).Error; err != nil {
		http.Error(w, "Failed to delete upload", http.StatusInternalServerError)
		return
	}

	// Respond success
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Deleted successfully"})
}


func TrashRecover(w http.ResponseWriter, r *http.Request) {
	log.Println("in TrashRecover")
	if r.Method != http.MethodPatch {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/images/trash/recover/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid upload ID", http.StatusBadRequest)
		return
	}

	var upload models.Upload
	if err := config.DB.First(&upload, id).Error; err != nil {
		http.Error(w, "Upload not found", http.StatusNotFound)
		return
	}

	var maxIndex int
	config.DB.Model(&models.Upload{}).
		Where("vault_id = ?", id).
		Select("COALESCE(MAX(order_index), 0)").Scan(&maxIndex)
	upload.DeletedAt = nil
	upload.OrderIndex = maxIndex
	if err := config.DB.Save(&upload).Error; err != nil {
		http.Error(w, "Failed to recover", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Recovered"})
}