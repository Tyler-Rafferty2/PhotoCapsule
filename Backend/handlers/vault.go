package handlers

import (
	"encoding/json"
	"net/http"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"fmt"

	"photovault/config"
	"photovault/utils"
	"photovault/models"
	"strings"
)

type NewVaultRequest struct {
	Name            string `json:"Name"`
	Description     string `json:"Description"`
	CoverImage      string `json:"CoverImage"`
	IncludeInCapsule bool   `json:"IncludeInCapsule"`
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

	if strings.TrimSpace(req.Name) == "" {
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
		http.Error(w, "Vault already exists", http.StatusConflict)
		return
	}

	newVault := models.Vault{
		Title:       req.Name,
		UserID:      userId,
		Description: req.Description,
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

	var vault models.Vault
	if err := config.DB.First(&vault, vaultId).Error; err != nil || vault.UserID != userId {
		http.Error(w, "Vault not found or forbidden", http.StatusForbidden)
		return
	}

	fileHeader, _, err := r.FormFile("coverImage")
	if err != nil {
		http.Error(w, "No file uploaded", http.StatusBadRequest)
		return
	}
	defer fileHeader.Close()
	filename := fmt.Sprintf("%d_%s", vaultId, "cover.jpg")
	dstPath := filepath.Join("uploads", filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Could not save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, fileHeader); err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Create CoverImage model record
	coverImage := models.CoverImage{
		VaultID:           uint(vaultId),
		Filename:          filename,
	}

	if err := config.DB.Create(&coverImage).Error; err != nil {
		http.Error(w, "Failed to save cover image in DB", http.StatusInternalServerError)
		return
	}

	// Link to vault
	vault.CoverImageID = &coverImage.ID
	vault.CoverImageURL = &filename
	if err := config.DB.Save(&vault).Error; err != nil {
		http.Error(w, "Failed to link cover image", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Cover image uploaded and linked successfully",
	})
}
