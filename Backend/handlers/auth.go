package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"log"

	"golang.org/x/crypto/bcrypt"

	"photovault/config"
	"photovault/models"
	"photovault/utils"
	"photovault/services"
)

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SigninRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func SignupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var existing models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	tokenVerify, err := utils.GenerateToken(32)
	if err != nil {
		log.Println("Failed to generate token:", err)
		// handle error
	}

	newUser := models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		VerificationToken: tokenVerify, 
    	TokenExpiresAt:    time.Now().Add(30 * time.Minute),
	}

	if err := config.DB.Create(&newUser).Error; err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	services.SendVerifyEmail(newUser.Email,newUser.VerificationToken)
	json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}

func SigninHandler(w http.ResponseWriter, r *http.Request) {
	// if r.Method != http.MethodPost {
	// 	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	// 	return
	// }
	log.Printf("n the sign in")
	var req SigninRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	if !user.IsVerified {
		http.Error(w, "You must verify your account before signing in", http.StatusUnauthorized)
		return
	}

	// 1. Generate both tokens first
	accessToken, err := utils.CreateJWT(user.ID, user.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	refreshToken, err := utils.CreateRefreshToken(user.ID, user.Email)
	if err != nil {
		http.Error(w, "Failed to generate refresh token", http.StatusInternalServerError)
		return
	}

	// 2. Set ALL headers before writing the body or status
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   false, // Switch this if on HTTPS
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})
	log.Println(refreshToken)
	w.Header().Set("Content-Type", "application/json")

	// 3. (Optional) Explicitly write the status header. If you omit this,
	//    Encode() will automatically send 200 OK.
	w.WriteHeader(http.StatusOK)

	// 4. Encode and write the JSON body. This sends the response.
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login successful",
		"token":   accessToken,
	})
}

func RefreshHandler(w http.ResponseWriter, r *http.Request) {
	// Get the cookie
	log.Print("Refreshing")
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "Refresh token not provided", http.StatusUnauthorized)
		return
	}
	refreshToken := cookie.Value

	// Look up the token in the DB
	var tokenRecord models.RefreshToken
	if err := config.DB.Where("token_hash = ?", refreshToken).First(&tokenRecord).Error; err != nil {
		http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	}
	
	// Check if expired
	if tokenRecord.ExpiresAt.Before(time.Now()) {
		http.Error(w, "Refresh token expired", http.StatusUnauthorized)
		return
	}

	// Check if revoked
	if tokenRecord.IsRevoked {
		http.Error(w, "Refresh token revoked", http.StatusUnauthorized)
		return
	}


	// (Optional) Rotate the refresh token
	newRefreshToken, err := utils.CreateRefreshToken(tokenRecord.UserID, tokenRecord.Email)
	if err != nil {
		http.Error(w, "Could not rotate refresh token", http.StatusInternalServerError)
		return
	}

	// Delete the old refresh token (optional if rotating)
	config.DB.Where("token_hash = ?", tokenRecord.TokenHash).Delete(&models.RefreshToken{})

	// Set new refresh token in cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    newRefreshToken,
		HttpOnly: true,
		Secure:   true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	// Create new access token
	accessToken, err := utils.CreateJWT(tokenRecord.UserID, tokenRecord.Email)
	if err != nil {
		http.Error(w, "Could not generate access token", http.StatusInternalServerError)
		return
	}

	// Send access token in response body
	json.NewEncoder(w).Encode(map[string]string{
		"access_token": accessToken,
	})
}

func VerifyEmailHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("verifying")
    token := r.URL.Query().Get("token")
    if token == "" {
        http.Error(w, "Missing token", http.StatusBadRequest)
        return
    }

    // If hashed, hash the token here
    // hashedToken := HashToken(token)
	
    var user models.User
    err := config.DB.Where("verification_token = ?", token).First(&user).Error
    if err != nil || user.TokenExpiresAt.Before(time.Now()) || user.IsVerified {
        http.Error(w, "Invalid or expired token", http.StatusBadRequest)
        return
    }

    user.IsVerified = true
    user.VerificationToken = ""
    user.TokenExpiresAt = time.Time{}

    config.DB.Save(&user)

    w.Write([]byte("Email verified! You can now log in."))
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("refresh_token")

	if err == http.ErrNoCookie {
		log.Println("[Logout] No refresh token cookie found.")
	} else if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if err == nil {
		token := cookie.Value

		if dbErr := utils.InvalidateRefreshToken(token); dbErr != nil {
			log.Println("[Logout Error] Database invalidation failed: %v\n", dbErr)
		}
	}

	expiredCookie := http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/", // This should match the path of the original cookie
		Expires:  time.Now().Add(-1 * time.Hour), // Set a time in the past
		HttpOnly: true,
		Secure:   false, // Use true in production with HTTPS
		SameSite: http.SameSiteNoneMode, // Or appropriate SameSite setting
	}
	http.SetCookie(w, &expiredCookie)

	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{"message": "Logout successful"}
	json.NewEncoder(w).Encode(response)

	log.Println("[Logout] Refresh token and cookie cleared successfully.")
}

