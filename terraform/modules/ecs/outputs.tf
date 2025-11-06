output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "expressjs_service_url" {
  description = "URL for Express.js service"
  value       = "http://${aws_lb.main.dns_name}/api"
}

output "nextjs_service_url" {
  description = "URL for Next.js service"
  value       = var.certificate_arn != "" ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}

