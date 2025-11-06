variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging, dev)"
  type        = string
  default     = "dev"
}

variable "instance_type" {
  description = "EC2 instance type (use t2.micro for free tier)"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of the AWS EC2 Key Pair for SSH access"
  type        = string
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH (restrict to your IP in production)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # WARNING: Restrict this in production!
}

variable "allocate_elastic_ip" {
  description = "Allocate an Elastic IP for static IP address"
  type        = bool
  default     = false
}

# Application Configuration
variable "openai_api_key" {
  description = "OpenAI API key"
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

# Repository Configuration
variable "repo_url" {
  description = "Git repository URL to clone (leave empty to skip)"
  type        = string
  default     = ""
}

variable "repo_branch" {
  description = "Git branch to checkout"
  type        = string
  default     = "main"
}

