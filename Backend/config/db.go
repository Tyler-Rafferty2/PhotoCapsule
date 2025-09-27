package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"photovault/models"
)

var DB *gorm.DB

func ConnectToDB() {
	log.Println("Attempting to connect to the database with hardcoded credentials...")
    if(os.Getenv("APP_ENV") == "test"){
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
		
	}else{
		// This is the hardcoded DSN string
		log.Println("not in test")
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		host := os.Getenv("DB_HOST")
		port := os.Getenv("DB_PORT")
		dbname := os.Getenv("DB_NAME")

		dsn := fmt.Sprintf("postgresql://%s:%s@%s:%s/%s", user, password, host, port, dbname)
		
		// Log the configuration for debugging
		log.Printf("PreferSimpleProtocol will be set to true.")

		var err error
		DB, err = gorm.Open(postgres.New(postgres.Config{
			DSN:                  dsn,
			PreferSimpleProtocol:  true, // disables implicit prepared statement usage
		}), &gorm.Config{})
		if err != nil {
			log.Fatal("Failed to connect to DB:", err)
		}
	}

	fmt.Println("✅ Connected to PostgreSQL database with GORM!")
}