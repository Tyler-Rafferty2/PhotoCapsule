package services

import (
	"log"
	"fmt"
	"photovault/config"
	"photovault/models"
	"github.com/resend/resend-go/v2"
)

func SendEmail() {
    apiKey := config.GetEnv("resend_api", "")
	if apiKey == "" {
		log.Println("apiKey not set. Please define resend_api in environment variables.")
	}
    client := resend.NewClient(apiKey)

    params := &resend.SendEmailRequest{
        From:    "no-reply@myphotocapsule.com",
        To:      []string{"tjraff5@gmail.com"},
        Subject: "Hello World",
        Html:    "<p>Congrats on sending your <strong>first email</strong>!</p>",
    }

    sent, err := client.Emails.Send(params)
	if err != nil {
		log.Fatal("Failed to send email:", err)
	}
	log.Print(sent)
}

func SendVerifyEmail(email, verifyToken string) {
	apiKey := config.GetEnv("resend_api", "")
	if apiKey == "" {
		log.Println("apiKey not set. Please define resend_api in environment variables.")
		return
	}

	client := resend.NewClient(apiKey)


	verifyURL := fmt.Sprintf("https://myphotocapsule.com/verify?token=%s", verifyToken)

	html := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fafafa;">
			<h2 style="color: #333; text-align: center;">Verify Your Account</h2>
			<p style="font-size: 16px; color: #555; text-align: center;">
			Thanks for signing up! Please confirm your email address by clicking the button below:
			</p>
			<div style="text-align: center; margin: 30px 0;">
			<a href="%s" 
				style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 6px;">
				Verify Email
			</a>
			</div>
			<p style="font-size: 14px; color: #777; text-align: center;">
			If you didn’t request this, you can safely ignore this email.
			</p>
		</div>
		`, verifyURL)


	params := &resend.SendEmailRequest{
		From:    "no-reply@myphotocapsule.com",
		To:      []string{email},
		Subject: "Please Verify Your Account",
		Html:    html,
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		log.Println("Failed to send email:", err)
	}

	log.Printf("Verification email sent to %s: %+v", email, sent)
}

func SendOpenEmail(email string, capsuleID uint) {
    // Get Resend API key from environment
    apiKey := config.GetEnv("resend_api", "")
    if apiKey == "" {
        log.Println("apiKey not set. Please define resend_api in environment variables.")
        return
    }

	var vault models.Vault
	if err := config.DB.First(&vault, capsuleID).Error; err != nil {
		log.Println("Vault not found")
		return
	}

	vault.Status = "open"

	if err := config.DB.Save(&vault).Error; err != nil {
		log.Println("Failed to update vault")
		return
	}

    client := resend.NewClient(apiKey)

    // Link to open the capsule
    capsuleURL := fmt.Sprintf("https://www.myphotocapsule.com/view/%d", capsuleID)

    // HTML content for the email
    html := fmt.Sprintf(`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fafafa;">
        <h2 style="color: #333; text-align: center;">Your Capsule is Ready!</h2>
        <p style="font-size: 16px; color: #555; text-align: center;">
            The capsule you created is now ready to be opened. Click the button below to view it:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="%s" 
               style="display: inline-block; padding: 14px 28px; background-color: #4CAF50; color: white; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 6px;">
               Open Capsule
            </a>
        </div>
        <p style="font-size: 14px; color: #777; text-align: center;">
            If you didn’t expect this email, you can safely ignore it.
        </p>
    </div>
    `, capsuleURL)

    // Email parameters
    params := &resend.SendEmailRequest{
        From:    "no-reply@myphotocapsule.com",
        To:      []string{email},
        Subject: "Your Capsule is Ready to Open!",
        Html:    html,
    }

    // Send the email
    sent, err := client.Emails.Send(params)
    if err != nil {
        log.Println("Failed to send email:", err)
        return
    }

    log.Printf("Capsule email sent to %s: %+v", email, sent)
}
