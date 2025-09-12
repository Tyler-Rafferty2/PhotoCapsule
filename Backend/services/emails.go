package services

import (
	"log"
	"fmt"
	"photovault/config"
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


	verifyURL := fmt.Sprintf("https://photo-capsule.vercel.app/verify?token=%s", verifyToken)

	html := fmt.Sprintf(`
		<h2>Verify Your Account</h2>
		<p>Thanks for signing up! Please confirm your email address by clicking the button below:</p>
		<p><a href="%s" 
			style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
			Verify Email
		</a></p>
		<p>If you didn’t request this, you can safely ignore this email.</p>
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