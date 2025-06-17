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

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

type Upload struct {
	ID         uint      `gorm:"primaryKey"`
	Filename   string    `gorm:"not null"`
	UploadTime time.Time `gorm:"autoCreateTime"`
}

type Image struct {
	ID       uint   `json:"id"`
	Filename string `json:"filename"`
	Path     string `json:"path"`
}

func imagesHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Sample data (replace with real file data)
	images := []Image{
		{Filename: "cat.jpg", Path: "uploads/1.jpg"},
	}

	w.Header().Set("Access-Control-Allow-Origin", "*") // for frontend access
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(images)
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
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
	upload := Upload{Filename: handler.Filename}
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

func connectToDB() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "password"),
		getEnv("DB_NAME", "timecapsule"),
		getEnv("DB_PORT", "5432"),
	)


	fmt.Println("📌 DSN:", dsn) // <--- log it here!

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to DB:", err)
	}

	// Automatically create the table if it doesn't exist
	if err := db.AutoMigrate(&Upload{}); err != nil {
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

	http.HandleFunc("/upload", uploadHandler)

	http.HandleFunc("/images", imagesHandler)
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	fmt.Println("🚀 Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
