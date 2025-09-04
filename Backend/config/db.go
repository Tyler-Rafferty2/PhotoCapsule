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
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=require",
		"aws-1-us-east-1.pooler.supabase.com",
		"postgres.rjkunrqftevwfssronze",
		"#k4V6neSN8*5v4q",
		"postgres",
		"6543",
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
