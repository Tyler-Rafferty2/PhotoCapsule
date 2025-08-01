package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"log"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"github.com/joho/godotenv"
	"crypto/rand"
	"encoding/hex"
	 "gorm.io/gorm/clause"

	"photovault/config"
	"photovault/models"

)

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SigninRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

var jwtSecret []byte;

func createJWT(userID uint, email string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(15 * time.Minute).Unix(), // expires in 15 minutes
	})

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found; using OS env vars only")
	}

	secret := config.GetEnv("secret_token", "")
	if secret == "" {
		log.Fatal("Token not set. Please define secret_token in environment variables.")
	}

	jwtSecret = []byte(secret)

	return token.SignedString(jwtSecret)
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

	newUser := models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
	}

	if err := config.DB.Create(&newUser).Error; err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}

func createRefreshToken(userID uint, userEmail string) (string, error) {
	// Generate a secure random 32-byte token
	tokenBytes := make([]byte, 32)
	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", err
	}
	token := hex.EncodeToString(tokenBytes)

	refreshToken := models.RefreshToken{
		UserID:    userID,
		Email:     userEmail,
		TokenHash: token,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		IsRevoked: false,
	}

	err = config.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "email"}},
		UpdateAll: true,
	}).Create(&refreshToken).Error

	if err != nil {
		return "", err
	}

	return token, nil
}


func SigninHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

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

	// 1. Generate both tokens first
	accessToken, err := createJWT(user.ID, user.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	refreshToken, err := createRefreshToken(user.ID, user.Email)
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


	// (Optional) Rotate the refresh token
	newRefreshToken, err := createRefreshToken(tokenRecord.UserID, tokenRecord.Email)
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
	accessToken, err := createJWT(tokenRecord.UserID, tokenRecord.Email)
	if err != nil {
		http.Error(w, "Could not generate access token", http.StatusInternalServerError)
		return
	}

	// Send access token in response body
	json.NewEncoder(w).Encode(map[string]string{
		"access_token": accessToken,
	})
}

