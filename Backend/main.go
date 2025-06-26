package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
	"encoding/json"
	"strconv"
	"strings"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"golang.org/x/crypto/bcrypt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

var db *gorm.DB

type User struct {
	ID           uint      `gorm:"primaryKey"`
	Email        string    `gorm:"unique;not null"`
	PasswordHash string    `gorm:"not null"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	Vaults       []Vault
}

type Vault struct {
	ID          uint      `gorm:"primaryKey"`
	UserID      uint      `gorm:"not null"`
	Title       string    `gorm:"not null"`
	Description string
	UnlockDate  *time.Time
	CreatedAt   time.Time

	Uploads       []Upload
}

type Upload struct {
	ID         uint      `gorm:"primaryKey"`
	VaultID    uint      `gorm:"not null"`
	Filename   string    `gorm:"not null"`
	UploadTime time.Time `gorm:"autoCreateTime"`
}

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SigninRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type NewVaultRequest struct {
	Name    string `json:"name"`
}

var jwtSecret []byte;

func createJWT(userID uint, email string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(24 * time.Hour).Unix(), // expires in 1 day
	})

	return token.SignedString(jwtSecret)
}

func getUserFromToken(r *http.Request) (uint, string, error) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return 0, "", fmt.Errorf("missing or invalid Authorization header")
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return 0, "", fmt.Errorf("invalid token: %v", err)
	}

	claims := token.Claims.(jwt.MapClaims)
	userID := uint(claims["user_id"].(float64))
	email := claims["email"].(string)

	return userID, email, nil
}


func imagesHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	VaultIdStr := strings.TrimPrefix(r.URL.Path, "/images/") 
	vaultId, err := strconv.ParseUint(VaultIdStr, 10, 64)
	userId, _, err := getUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	var vault Vault
	if err := db.First(&vault, vaultId).Error; err != nil {
		http.Error(w, "Vault not found", http.StatusNotFound)
		return
	}

	if vault.UserID != userId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var uploads []Upload
	if err := db.Where("VaultID = ?", vaultId).Find(&uploads).Error; err != nil {
		http.Error(w, "Failed to retrieve uploads", http.StatusInternalServerError)
		return
	}

	var imageURLs []string
	for _, u := range uploads {
		url := fmt.Sprintf("%s", u.Filename)
		imageURLs = append(imageURLs, url)
	}
	log.Println(imageURLs)
	w.Header().Set("Access-Control-Allow-Origin", "*") // for frontend access
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(imageURLs)
}

//These needs to send VaultID or just vault name or smthn
func uploadHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	log.Println("in the upload")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	VaultIdStr := strings.TrimPrefix(r.URL.Path, "/upload/") 
	log.Println("✅ Parsed vault ID:", VaultIdStr)
	vaultId, err := strconv.ParseUint(VaultIdStr, 10, 64)
	log.Println("✅ Parsed vault ID:", vaultId)

	userId, _, err := getUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var vault Vault
	if err := db.First(&vault, vaultId).Error; err != nil {
		http.Error(w, "Vault not found", http.StatusNotFound)
		return
	}

	if vault.UserID != userId {
		http.Error(w, "Forbidden", http.StatusForbidden)
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

	_, err = io.Copy(dst, file)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Log upload to DB using GORM
	upload := Upload{
		VaultID: uint(vaultId),
		Filename: handler.Filename}
	log.Println(upload);
	if err := db.Create(&upload).Error; err != nil {
		http.Error(w, "Failed to log upload in DB", http.StatusInternalServerError)
		log.Println("DB insert error:", err)
		return
	}
	log.Println("✅ Successfully inserted:", upload)
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"message":"Upload successful","filename":"%s"}`, handler.Filename)
}

func signupHandler(w http.ResponseWriter, r *http.Request) {
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight request
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Missing email or password", http.StatusBadRequest)
		return
	}

	// Check if user already exists
	var existing User
	if err := db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Create the user
	newUser := User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
	}

	if err := db.Create(&newUser).Error; err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message":"User created successfully"}`))
}

func getVaults(w http.ResponseWriter, r *http.Request) {
	// Only allow GET

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userId, _, err := getUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	// Sample data (replace with real file data)
	var vaults []Vault
	if err := db.Where("user_id = ?", userId).Find(&vaults).Error; err != nil {
		http.Error(w, "Failed to retrieve uploads", http.StatusInternalServerError)
		return
	}

	// var vaultNames []string
	// for _, u := range vaults {
	// 	name := fmt.Sprintf("%s", u.Title)
	// 	vaultNames = append(vaultNames, name)
	// }
	// log.Println(vaultNames)
	w.Header().Set("Access-Control-Allow-Origin", "*") // for frontend access
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vaults)
}

func addVault(w http.ResponseWriter, r *http.Request) {
	
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	// Handle preflight request
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req NewVaultRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}	

	if req.Name == "" {
		http.Error(w, "Missing name", http.StatusBadRequest)
		return
	}

	// Check if vault already exists
	var existing Vault
	if err := db.Where("Title = ?", req.Name).First(&existing).Error; err == nil {
		http.Error(w, "Vault already registered", http.StatusConflict)
		return
	}


	userId, _, err := getUserFromToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Create the vault
	newVault := Vault{
		Title:        req.Name,
		UserID: 	  userId,
		Description:  "fix later",
	}

	if err := db.Create(&newVault).Error; err != nil {
		http.Error(w, "Failed to create vault", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message":"User created successfully"}`))
}

func signinHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type , Authorization")

	// Handle preflight OPTIONS
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request body
	var req SigninRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Missing email or password", http.StatusBadRequest)
		return
	}

	// Find user by email
	var user User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Compare password with stored hash
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	w.WriteHeader(http.StatusOK)
	token, err := createJWT(user.ID, user.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login successful",
		"token":   token,
	})
}



func connectToDB() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "password"),
		getEnv("DB_NAME", "timecapsule"),
		getEnv("DB_PORT", "5432"),
	)


	//fmt.Println("📌 DSN:", dsn) // <--- log it here!

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to DB:", err)
	}

	// Automatically create the table if it doesn't exist
	if err := db.AutoMigrate(&User{}, &Vault{}, &Upload{}); err != nil {
		log.Fatal("Auto-migration failed:", err)
	}

	fmt.Println("✅ Connected to PostgreSQL database with GORM!")
}

func getEnv(key, fallback string) string {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	return val
}

func main() {
	connectToDB()

	if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
		log.Fatal(err)
	}

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found; using OS env vars only")
	}

	secret := getEnv("secret_token", "")
	if secret == "" {
		log.Fatal("Token not set. Please define secret_token in environment variables.")
	}
	jwtSecret = []byte(secret)

	http.HandleFunc("/upload/", uploadHandler)

	http.HandleFunc("/images/", imagesHandler)

	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	http.HandleFunc("/signup", signupHandler)

	http.HandleFunc("/signin", signinHandler)

	http.HandleFunc("/api/addvaults", addVault)

	http.HandleFunc("/api/getvaults", getVaults)

	fmt.Println("🚀 Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
