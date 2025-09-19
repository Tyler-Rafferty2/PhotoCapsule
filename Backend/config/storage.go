package config

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var R2Client *s3.Client
var R2Bucket string

func ConnectToR2() {
	accountID := os.Getenv("accountID")
	accessKey := os.Getenv("accessKey")
	secretKey := os.Getenv("secretKey")
	R2Bucket = os.Getenv("R2Bucket")

	if(os.Getenv("APP_ENV") != "test"){
	if accountID == "" || accessKey == "" || secretKey == "" || R2Bucket == "" {
		log.Fatal("❌ Missing R2 environment variables")
	}

	// R2 endpoint includes account ID
	endpoint := "https://" + accountID + ".r2.cloudflarestorage.com"

	// Custom resolver to force R2 endpoint
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, opts ...interface{}) (aws.Endpoint, error) {
		if service == s3.ServiceID {
			return aws.Endpoint{
				URL:           endpoint,
				SigningRegion: "auto", 
			}, nil
		}
		return aws.Endpoint{}, &aws.EndpointNotFoundError{}
	})

	// Load config with region = "auto"
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("auto"),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithEndpointResolverWithOptions(customResolver),
	)
	if err != nil {
		log.Fatalf("❌ failed to load R2 config: %v", err)
	}

	R2Client = s3.NewFromConfig(cfg)
	}
	log.Println("✅ Connected to R2 bucket:", R2Bucket)
}
