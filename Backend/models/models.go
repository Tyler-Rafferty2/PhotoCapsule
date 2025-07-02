package models

import (
	"time"
)

type User struct {
	ID           uint      `gorm:"primaryKey"`
	Email        string    `gorm:"unique;not null"`
	PasswordHash string    `gorm:"not null"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	Vaults       []Vault   `gorm:"foreignKey:UserID"`
}

type Vault struct {
	ID          uint      `gorm:"primaryKey"`
	UserID      uint      `gorm:"not null"`
	Title       string    `gorm:"not null"`
	Description string
	UnlockDate  *time.Time
	CreatedAt   time.Time

	Uploads []Upload `gorm:"foreignKey:VaultID"`
}

type Upload struct {
	ID         uint       `gorm:"primaryKey"`
	VaultID    uint       `gorm:"not null"`
	Filename   string     `gorm:"not null"`
	UploadTime time.Time  `gorm:"autoCreateTime"`
	DeletedAt  *time.Time `gorm:"default:null"`
	OrderIndex int  	  `gorm:"not null;default:0"`
}
