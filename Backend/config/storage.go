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
	accountID := "da56f9458e5e41425aee044e14d4c5e6"
	accessKey := "d8ac34d812e905c0bd6f101e1d1c6129"
	secretKey := "7db491d5cf16831df41a19d7bdf2e8908664263743d2a6c2d9e4ab1595c78e4e"
	R2Bucket = "photocapsule"

	if accountID == "" || accessKey == "" || secretKey == "" || R2Bucket == "" {
		log.Fatal("❌ Missing R2 environment variables")
	}

	endpoint := "https://" + accountID + ".r2.cloudflarestorage.com"

	customResolver := aws.EndpointResolverFunc(func(service, region string) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:           endpoint,
			SigningRegion: "auto",
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithEndpointResolver(customResolver),
	)
	if err != nil {
		log.Fatalf("❌ failed to load R2 config: %v", err)
	}

	R2Client = s3.NewFromConfig(cfg)
	log.Println("✅ Connected to R2 bucket:", R2Bucket)
}
