package models

import (
	"time"
)

type User struct {
	ID               uint      `gorm:"primaryKey"`
	Email            string    `gorm:"unique;not null"`
	DisplayName      string
	PlanType         string    `gorm:"default:free"` 
	TotalStorageUsed int64     `gorm:"default:0"` 
	PasswordHash     string    `gorm:"not null"`
	CreatedAt        time.Time `gorm:"autoCreateTime"`

	Vaults []Vault `gorm:"foreignKey:UserID"`

	IsVerified        bool      `gorm:"default:true"`
	VerificationToken string    `gorm:"size:64"`
	TokenExpiresAt    time.Time
}

type Vault struct {
	ID          uint      `gorm:"primaryKey"`
	UserID      uint      `gorm:"not null"`
	Title       string    `gorm:"not null"`
	TotalStorageUsed int64     `gorm:"default:0"`
	Description string
	CoverImageID  *uint
	CoverImageURL *string
	UnlockDate  *time.Time
	CreatedAt   time.Time
	Status      string

	User            User      `gorm:"foreignKey:UserID"`
	Uploads []Upload `gorm:"foreignKey:VaultID"`
}

type Upload struct {
	ID         uint       `gorm:"primaryKey"`
	VaultID    uint       `gorm:"not null"`
	Vault      Vault      `gorm:"foreignKey:VaultID"`
	Filename   string     `gorm:"not null"`
	Size        int64      `gorm:"not null"`
	Key       string         `gorm:"uniqueIndex"`
	UploadTime time.Time  `gorm:"autoCreateTime"`
	DeletedAt  *time.Time `gorm:"default:null"`
	OrderIndex int  	  `gorm:"not null;default:0"`
}

type CoverImage struct {
	ID              uint      `gorm:"primaryKey"`
	VaultID         uint      `gorm:"not null"`
	Vault      Vault      `gorm:"foreignKey:VaultID"`
	Filename        string    `gorm:"not null"`
	UploadTime      time.Time `gorm:"autoCreateTime"`
}

type RefreshToken struct {
    UserID      uint   `gorm:"not null"`
	Email        string    `gorm:"unique;not null"`
    TokenHash   string `gorm:"not null;uniqueIndex"`
    ExpiresAt   time.Time `gorm:"not null"`
    IsRevoked   bool   `gorm:"default:false"`
}