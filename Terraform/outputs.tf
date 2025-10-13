output "public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.app_server.public_ip
}

output "ssh_command" {
  description = "Command to SSH into the EC2 instance"
  value       = "ssh -i ${path.module}/ec2_key.pem ec2-user@${aws_instance.app_server.public_ip}"
}
