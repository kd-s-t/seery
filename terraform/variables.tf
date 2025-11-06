variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Application Configuration
variable "openai_api_key" {
  description = "OpenAI API key (stored in SSM Parameter Store)"
  type        = string
  sensitive   = true
}

variable "network" {
  description = "BNB Chain network (testnet or mainnet)"
  type        = string
  default     = "testnet"
}

variable "bnb_testnet_rpc" {
  description = "BNB Chain testnet RPC URL"
  type        = string
  default     = "https://data-seed-prebsc-1-s1.binance.org:8545"
}

variable "bnb_mainnet_rpc" {
  description = "BNB Chain mainnet RPC URL"
  type        = string
  default     = "https://bsc-dataseed.binance.org/"
}

variable "contract_address" {
  description = "Deployed PredictionMarket contract address"
  type        = string
  default     = ""
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for the application (e.g., seer.example.com)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS (leave empty to create new)"
  type        = string
  default     = ""
}

# Container Resources
variable "expressjs_cpu" {
  description = "CPU units for Express.js container (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "expressjs_memory" {
  description = "Memory for Express.js container (in MB)"
  type        = number
  default     = 1024
}

variable "nextjs_cpu" {
  description = "CPU units for Next.js container (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "nextjs_memory" {
  description = "Memory for Next.js container (in MB)"
  type        = number
  default     = 2048
}

