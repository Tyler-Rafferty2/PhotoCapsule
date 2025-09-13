package jobs

import (
	"fmt"
	"time"
	"photovault/config"
	"photovault/models"
	"photovault/services"
	"github.com/robfig/cron/v3"
)

func StartCapsuleCron() {
	c := cron.New()

	// Runs every minute
	c.AddFunc("* * * * *", func() {
		now := time.Now().Truncate(time.Minute)

		var capsules []models.Vault
		result := config.DB.Where("unlock_date <= ?", now).Find(&capsules)
		if result.Error != nil {
			fmt.Println("Error fetching capsules:", result.Error)
			return
		}

		for _, capsule := range capsules {
			// Mark as opened
			// capsule.IsOpened = true
			//config.DB.Save(&capsule)

			// You could trigger a notification, send an email, etc.
			//Services.SendEmail()
			var cap Capsule
			if err := db.Preload("User").First(&cap, capsuleID).Error; err != nil {
				return "", err
			}
			fmt.Println(cap.User.Email)
			fmt.Println("Opened capsule ID:", capsule.ID)
			services.SendOpenEmail(cap.User.Email,capsule.ID)
		}
	})

	c.Start()
}
