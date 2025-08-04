package utils

import (
	"fmt"
	"net/http"
	"strings"
	"time"
	"log"

	"gorm.io/gorm/clause"
	"crypto/rand"
	"encoding/hex"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"photovault/config"
	"photovault/models"
)

func GetUserFromToken(r *http.Request) (uint, string, error) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return 0, "", fmt.Errorf("missing or invalid Authorization header")
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return config.JwtSecret, nil
	})

	if err != nil || !token.Valid {
		return 0, "", fmt.Errorf("invalid token: %v", err)
	}

	claims := token.Claims.(jwt.MapClaims)
	userID := uint(claims["user_id"].(float64))
	email := claims["email"].(string)

	return userID, email, nil
}

func GenerateToken(n int) (string, error) {
	bytes := make([]byte, n)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

var jwtSecret []byte;

func CreateJWT(userID uint, email string) (string, error) {
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

func CreateRefreshToken(userID uint, userEmail string) (string, error) {
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

func InvalidateRefreshToken(token string) error {

	result := config.DB.Model(&models.RefreshToken{}).Where("token_hash = ?", token).Updates(map[string]interface{}{"IsRevoked": true})

    // Check for a database error.
    if result.Error != nil {
        return fmt.Errorf("failed to update token record: %w", result.Error)
    }

    // Check if any rows were actually updated.
    if result.RowsAffected == 0 {
        return fmt.Errorf("no token record found to update")
    }

    fmt.Printf("[DB] Successfully revoked token.\n")
    return nil
}