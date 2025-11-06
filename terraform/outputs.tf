output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.ecs.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = module.ecs.alb_zone_id
}

output "expressjs_service_url" {
  description = "URL for Express.js backend service"
  value       = module.ecs.expressjs_service_url
}

output "nextjs_service_url" {
  description = "URL for Next.js frontend service"
  value       = module.ecs.nextjs_service_url
}

output "expressjs_repository_url" {
  description = "ECR repository URL for Express.js"
  value       = module.ecr.expressjs_repository_url
}

output "nextjs_repository_url" {
  description = "ECR repository URL for Next.js"
  value       = module.ecr.nextjs_repository_url
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.security.vpc_id
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

