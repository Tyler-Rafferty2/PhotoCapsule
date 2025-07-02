package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"log"

	"photovault/config"
	"photovault/models"
	"photovault/utils"
)

type UploadResponse struct {
	ID       uint   `json:"id"`
	Filename string `json:"filename"`
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

	var vault models.Vault
	if err := config.DB.First(&vault, vaultId).Error; err != nil || vault.UserID != userId {
		http.Error(w, "Vault not found or forbidden", http.StatusForbidden)
		return
	}

	file, handler, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Error retrieving the file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	dstPath := filepath.Join("uploads", handler.Filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Could not save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	var maxIndex int
	config.DB.Model(&models.Upload{}).
    	Where("vault_id = ?", vaultId).
    	Select("COALESCE(MAX(order_index), 0)").Scan(&maxIndex)

	upload := models.Upload{
		VaultID:  uint(vaultId),
		Filename: handler.Filename,
		OrderIndex: maxIndex + 1,
	}

	if err := config.DB.Create(&upload).Error; err != nil {
		http.Error(w, "Failed to log upload in DB", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "Upload successful",
		"filename": handler.Filename,
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
	for _, u := range uploads {
		responses = append(responses, UploadResponse{
			ID:       u.ID,
			Filename: u.Filename,
		})
	}
	json.NewEncoder(w).Encode(responses)
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
	log.Println("in TrashUpload")
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
	for _, u := range uploads {
		responses = append(responses, UploadResponse{
			ID:       u.ID,
			Filename: u.Filename,
		})
	}
	json.NewEncoder(w).Encode(responses)
}

func TrashDelete(w http.ResponseWriter, r *http.Request) {
	log.Println("in TrashDelete")
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/images/trash/delete/")
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

	if err := config.DB.Delete(&upload).Error; err != nil {
		http.Error(w, "Failed to delete upload", http.StatusInternalServerError)
		return
	}

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

	upload.DeletedAt = nil
	if err := config.DB.Save(&upload).Error; err != nil {
		http.Error(w, "Failed to recover", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Recovered"})
}