package config

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"photovault/models"
)

var DB *gorm.DB

func ConnectToDB() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		GetEnv("DB_HOST", "localhost"),
		GetEnv("DB_USER", "postgres"),
		GetEnv("DB_PASSWORD", "password"),
		GetEnv("DB_NAME", "timecapsule"),
		GetEnv("DB_PORT", "5432"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to DB:", err)
	}

	if err := DB.AutoMigrate(&models.User{}, &models.Vault{}, &models.Upload{}, &models.CoverImage{}, &models.RefreshToken{}); err != nil {
		log.Fatal("Auto-migration failed:", err)
	}

	fmt.Println("✅ Connected to PostgreSQL database with GORM!")
}
