package services

import (
	"log"
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
        From:    "onboarding@resend.dev",
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