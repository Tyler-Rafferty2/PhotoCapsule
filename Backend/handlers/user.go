package handlers

import (
    "net/http"
	"encoding/json"

    "photovault/config"
    "photovault/models"
	"photovault/utils"
)

func UserHandler(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.GetUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Build the response you want to send to frontend
	resp := map[string]interface{}{
		"id":                user.ID,
		"email":             user.Email,
		"displayName":       user.DisplayName,
		"planType":          user.PlanType,
		"totalStorageUsed":  user.TotalStorageUsed,
		"isVerified":        user.IsVerified,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
