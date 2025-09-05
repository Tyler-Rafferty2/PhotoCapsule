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
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		// This is the key change to prevent the prepared statement conflict
		// It tells GORM to not use a prepared statement cache
		// which is a common source of conflict with connection poolers like Supabase's
		PrepareStmt: false, 
	})
	if err != nil {
		log.Fatal("Failed to connect to DB:", err)
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.Vault{},
		&models.Upload{},
		&models.CoverImage{},
		&models.RefreshToken{},
	)
	if err != nil {
		// Only log warning, don’t exit
		log.Println("⚠️ Auto-migration warning:", err)
	} else {
		fmt.Println("✅ DB AutoMigrate succeeded")
	}

	fmt.Println("✅ Connected to PostgreSQL database with GORM!")
}
