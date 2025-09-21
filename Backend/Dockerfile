# Build stage
FROM golang:1.24.3-alpine AS builder

# Install git and ca-certificates (needed for go modules and HTTPS)
RUN apk add --no-cache git ca-certificates

RUN apk add --no-cache curl

# WORKDIR /app
# Copy go.mod and go.sum first to leverage Docker cache
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary with static linking
RUN go build -o server .

# Expose port
EXPOSE 8080

# Run the server
CMD ["./server"]

