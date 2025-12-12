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

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.seer.id
}

