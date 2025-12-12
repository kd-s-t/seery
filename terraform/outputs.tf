output "instance_id" {
  description = "EC2 instance ID"
  value       = module.ec2.instance_id
}

output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = module.ec2.public_ip
}

output "public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = module.ec2.public_dns
}

output "elastic_ip" {
  description = "Elastic IP address (if allocated)"
  value       = module.ec2.elastic_ip
}

output "nextjs_url" {
  description = "URL to access Next.js frontend"
  value       = "http://${var.allocate_elastic_ip && module.ec2.elastic_ip != null ? module.ec2.elastic_ip : module.ec2.public_ip}:3015"
}

output "api_url" {
  description = "URL to access Express.js API"
  value       = "http://${var.allocate_elastic_ip && module.ec2.elastic_ip != null ? module.ec2.elastic_ip : module.ec2.public_ip}:3016"
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i <your-key.pem> ec2-user@${var.allocate_elastic_ip && module.ec2.elastic_ip != null ? module.ec2.elastic_ip : module.ec2.public_ip}"
}
