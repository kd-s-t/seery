variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "alb_security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "expressjs_repository_url" {
  description = "ECR repository URL for Express.js"
  type        = string
}

variable "nextjs_repository_url" {
  description = "ECR repository URL for Next.js"
  type        = string
}

variable "task_execution_role_arn" {
  description = "ARN of ECS task execution role"
  type        = string
}

variable "task_role_arn" {
  description = "ARN of ECS task role"
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API key (will be stored in SSM)"
  type        = string
  sensitive   = true
}

variable "network" {
  description = "BNB Chain network"
  type        = string
}

variable "bnb_testnet_rpc" {
  description = "BNB Chain testnet RPC URL"
  type        = string
}

variable "bnb_mainnet_rpc" {
  description = "BNB Chain mainnet RPC URL"
  type        = string
}

variable "contract_address" {
  description = "Contract address"
  type        = string
}

variable "domain_name" {
  description = "Domain name"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
  default     = ""
}

variable "expressjs_cpu" {
  description = "CPU units for Express.js"
  type        = number
}

variable "expressjs_memory" {
  description = "Memory for Express.js (MB)"
  type        = number
}

variable "nextjs_cpu" {
  description = "CPU units for Next.js"
  type        = number
}

variable "nextjs_memory" {
  description = "Memory for Next.js (MB)"
  type        = number
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

