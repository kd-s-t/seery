output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.seer.id
}

output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.seer.public_ip
}

output "public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.seer.public_dns
}

output "elastic_ip" {
  description = "Elastic IP address (if allocated)"
  value       = var.allocate_elastic_ip ? aws_eip.seer[0].public_ip : null
}

output "nextjs_url" {
  description = "URL to access Next.js frontend"
  value       = "http://${var.allocate_elastic_ip ? aws_eip.seer[0].public_ip : aws_instance.seer.public_ip}:3015"
}

output "api_url" {
  description = "URL to access Express.js API"
  value       = "http://${var.allocate_elastic_ip ? aws_eip.seer[0].public_ip : aws_instance.seer.public_ip}:3016"
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i <your-key.pem> ec2-user@${var.allocate_elastic_ip ? aws_eip.seer[0].public_ip : aws_instance.seer.public_ip}"
}

