package handlers

import (
	"encoding/json"
	"net/http"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"fmt"
	"log"
	"bytes"
	"context"

	"photovault/config"
	"photovault/utils"
	"photovault/models"
	"strings"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/aws"
)

type NewVaultRequest struct {
	Name            string `json:"Name"`
	Description     string `json:"Description"`
	CoverImage      string `json:"CoverImage"`
	IncludeInCapsule bool   `json:"IncludeInCapsule"`
}

type CoverImageResponse struct {
	ID       uint   `json:"id"`
	Filename string `json:"filename"`
}

func AddVault(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req NewVaultRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == ""{
		http.Error(w, "Missing vault name", http.StatusBadRequest)
		return
	}

	userId, _, err := utils.GetUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var existing models.Vault
	if err := config.DB.Where("title = ? AND user_id = ?", req.Name, userId).First(&existing).Error; err == nil {
		http.Error(w, "Vault name already used", http.StatusConflict)
		return
	}

	newVault := models.Vault{
		Title:       req.Name,
		UserID:      userId,
		Description: req.Description,
		Status:      "open",
	}

	if err := config.DB.Create(&newVault).Error; err != nil {
		http.Error(w, "Failed to create vault", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"vaultId": newVault.ID})
}

func GetVaults(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userId, _, err := utils.GetUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var vaults []models.Vault
	if err := config.DB.Where("user_id = ?", userId).Find(&vaults).Error; err != nil {
		http.Error(w, "Failed to retrieve vaults", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vaults)
}

func CoverUploadHandler(w http.ResponseWriter, r *http.Request) {
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

	vaultIdStr := strings.TrimPrefix(r.URL.Path, "/cover/upload/")
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

	// Expect a single file field "image"
	file, handler, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "No file uploaded", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Check plan limits
	plan := utils.PlanLimits[user.PlanType]
	if user.TotalStorageUsed+handler.Size > plan.MaxStorage {
		http.Error(w, "Storage limit exceeded for your plan", http.StatusForbidden)
		return
	}

	// Read file into memory
	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, file); err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	// Generate a safe R2 key
	safeFilename := fmt.Sprintf("%d_cover.jpg", vaultId)
	key := fmt.Sprintf("vaults/%d/cover/%s", vaultId, safeFilename)

	// Upload to R2
	_, err = config.R2Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: &config.R2Bucket,
		Key:    &key,
		Body:   bytes.NewReader(buf.Bytes()),
	})
	if err != nil {
		http.Error(w, "Failed to upload to storage: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Save cover image model
	coverImage := models.CoverImage{
		VaultID:  uint(vaultId),
		Filename: handler.Filename,
		Key:      key,
	}
	if err := config.DB.Create(&coverImage).Error; err != nil {
		http.Error(w, "Failed to save cover image in DB", http.StatusInternalServerError)
		return
	}

	// Link to vault
	vault.CoverImageID = &coverImage.ID
	if err := config.DB.Save(&vault).Error; err != nil {
		http.Error(w, "Failed to link cover image", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Cover image uploaded and linked successfully",
		"key":     key,
	})
}


func GetCoverHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Get the logged-in user
	userID, _, err := utils.GetUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 2. Get cover image ID from URL
	coverIdStr := strings.TrimPrefix(r.URL.Path, "/image/cover/")
	coverID, err := strconv.ParseUint(coverIdStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid cover ID", http.StatusBadRequest)
		return
	}

	// 3. Look up cover image in DB
	var img models.CoverImage
	if err := config.DB.Preload("Vault").First(&img, "id = ?", coverID).Error; err != nil {
		log.Println("not found in cover lookup")
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}
  
	// 4. Check ownership via Vault
	if img.Vault.UserID != userID {
		log.Println("Forbidden")
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// 5. Get object from R2
	resp, err := config.R2Client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: &config.R2Bucket,
		Key:    aws.String(img.Key),
	})
	if err != nil {
		log.Println("Failed to retrieve file: ")
		http.Error(w, "Failed to retrieve file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// 6. Set headers and stream file
	w.Header().Set("Content-Disposition", "inline; filename="+strconv.Quote(img.Filename))
	if _, err := io.Copy(w, resp.Body); err != nil {
		http.Error(w, "Failed to stream file: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func DeleteVault(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		log.Printf("Invalid method: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userId, _, err := utils.GetUserFromToken(r)
	if err != nil {
		log.Printf("Unauthorized access: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vaultIdStr := strings.TrimPrefix(r.URL.Path, "/vault/delete/")
	vaultId, err := strconv.ParseUint(vaultIdStr, 10, 64)
	if err != nil {
		log.Printf("Invalid vault ID: %v", err)
		http.Error(w, "Invalid vault ID", http.StatusBadRequest)
		return
	}

	var vault models.Vault
	if err := config.DB.First(&vault, vaultId).Error; err != nil {
		log.Printf("Vault not found [vaultId=%d]: %v", vaultId, err)
		http.Error(w, "Vault not found", http.StatusNotFound)
		return
	}

	if vault.UserID != userId {
		log.Printf("Forbidden: user %d tried to delete vault %d belonging to user %d", userId, vault.ID, vault.UserID)
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var user models.User
	if err := config.DB.First(&user, userId).Error; err != nil {
		log.Printf("Failed to fetch user [userId=%d]: %v", userId, err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if vault.CoverImageID != nil {
		var coverImage models.CoverImage
		if err := config.DB.First(&coverImage, vault.CoverImageID).Error; err == nil {
			coverImagePath := filepath.Join("uploads", coverImage.Filename)

			// Attempt to delete file, but only log failure if it doesn't exist
			if err := os.Remove(coverImagePath); err != nil {
				if os.IsNotExist(err) {
					log.Printf("Cover image file not found (probably already deleted): %s", coverImagePath)
				} else {
					log.Printf("Failed to delete cover image file: %v", err)
					// Don’t abort
				}
			}

			// Attempt to delete DB record regardless
			if err := config.DB.Delete(&coverImage).Error; err != nil {
				log.Printf("Failed to delete cover image record: %v", err)
				// Don’t abort
			}
		} else {
			log.Printf("Cover image record not found: %v", err)
		}
	}

	var images []models.Upload
	if err := config.DB.Where("vault_id = ?", vault.ID).Find(&images).Error; err != nil {
		log.Printf("Failed to query images: %v", err)
	} else {
		for _, image := range images {
			imagePath := filepath.Join("uploads", image.Filename)

			if err := os.Remove(imagePath); err != nil {
				if os.IsNotExist(err) {
					log.Printf("Image file not found (probably already deleted): %s", imagePath)
				} else {
					log.Printf("Failed to delete image file %s: %v", image.Filename, err)
					// Don’t abort
				}
			}

			if err := config.DB.Delete(&image).Error; err != nil {
				log.Printf("Failed to delete image record for %s: %v", image.Filename, err)
				// Don’t abort
			}

			user.TotalStorageUsed -= image.Size
			if err := config.DB.Save(&user).Error; err != nil {
				http.Error(w, "Failed to update user storage", http.StatusInternalServerError)
				return
			}
		}
	}

	if err := config.DB.Delete(&vault).Error; err != nil {
		log.Printf("Failed to delete vault record [vaultId=%d]: %v", vault.ID, err)
		http.Error(w, "Failed to delete vault", http.StatusInternalServerError)
		return
	}

	log.Printf("Vault %d and associated data deleted by user %d", vault.ID, userId)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Vault and associated data deleted successfully"})
}

func GetVaultByID(w http.ResponseWriter, r *http.Request) {
	log.Println("in vaultID")
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	vaultIdStr := strings.TrimPrefix(r.URL.Path, "/vault/")
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
	if err := config.DB.First(&vault, vaultId).Error; err != nil {
		http.Error(w, "Vault not found", http.StatusNotFound)
		return
	}

	if vault.UserID != userId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vault)
}

func TitleAndDescChange(w http.ResponseWriter, r *http.Request) {
	log.Println("we are in title and change desc")
	if r.Method != http.MethodPatch {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/vault/changeTitleAndDesc/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid vault ID", http.StatusBadRequest)
		return
	}

	var vault models.Vault
	if err := config.DB.First(&vault, id).Error; err != nil {
		http.Error(w, "Vault not found", http.StatusNotFound)
		return
	}

	var input struct {
		Title       string `json:"Title"`
		Description string `json:"Description"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	vault.Title = input.Title
	vault.Description = input.Description

	if err := config.DB.Save(&vault).Error; err != nil {
		http.Error(w, "Failed to update vault", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vault)
}

func ChangeCapsuleStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/vault/changeStatus/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid vault ID", http.StatusBadRequest)
		return
	}

	var vault models.Vault
	if err := config.DB.First(&vault, id).Error; err != nil {
		http.Error(w, "Vault not found", http.StatusNotFound)
		return
	}

	var input struct {
		Status       string `json:"Status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	vault.Status = input.Status

	if err := config.DB.Save(&vault).Error; err != nil {
		http.Error(w, "Failed to update vault", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vault)
}