output "expressjs_repository_url" {
  description = "URL of Express.js ECR repository"
  value       = aws_ecr_repository.expressjs.repository_url
}

output "nextjs_repository_url" {
  description = "URL of Next.js ECR repository"
  value       = aws_ecr_repository.nextjs.repository_url
}

output "expressjs_repository_arn" {
  description = "ARN of Express.js ECR repository"
  value       = aws_ecr_repository.expressjs.arn
}

output "nextjs_repository_arn" {
  description = "ARN of Next.js ECR repository"
  value       = aws_ecr_repository.nextjs.arn
}

