terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region     = "us-east-1"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

resource "aws_key_pair" "deployer" {
  key_name   = "github-actions-key"
  public_key = var.ssh_public_key
}

resource "aws_security_group" "ec2_sg" {
  name        = "ec2_sg"
  description = "Allow SSH, HTTP, and HTTPS"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_ami" "amazon_linux2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.amazon_linux2023.id
  instance_type          = "t2.micro"
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  tags = {
    Name = "TerraformAppServer"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Update system
    sudo yum update -y
    
    # Install nginx
    sudo yum install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx

    # Install Certbot
    sudo yum install -y certbot python3-certbot-nginx

    # Create NGINX config
    sudo tee /etc/nginx/conf.d/api.myphotocapsule.com.conf > /dev/null <<'EOL'
    server {
        listen 80;
        server_name api.myphotocapsule.com;

        location / {
            proxy_pass http://localhost:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    EOL

    sudo nginx -t
    sudo systemctl reload nginx

    # Note: Run certbot manually after DNS is configured
    # sudo certbot --nginx -d api.myphotocapsule.com --non-interactive --agree-tos -m tjraff5@gmail.com
  EOF
}

output "instance_ip" {
  value = aws_instance.app_server.public_ip
  description = "Public IP of EC2 instance"
}

output "instance_id" {
  value = aws_instance.app_server.id
}