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
  description = "OpenAI API key (optional - leave empty to disable AI features)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "blockchain_network" {
  description = "BNB Chain network (testnet or mainnet)"
  type        = string
  default     = "testnet"
}

variable "blockchain_rpc" {
  description = "BNB Chain RPC URL (use testnet or mainnet RPC)"
  type        = string
  default     = "https://data-seed-prebsc-1-s1.binance.org:8545"
}

variable "blockchain_contract_address" {
  description = "Deployed PredictionMarket contract address"
  type        = string
  default     = "0x42067558c48f8c74C819461a9105CD47B90B098F"
}

variable "backend_domain" {
  description = "Backend API domain URL"
  type        = string
  default     = "https://theseery.com/api"
}

variable "blockchain_private_key" {
  description = "Private key for automated blockchain transactions (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "blockchain_wallet_address" {
  description = "Wallet address for blockchain transactions (optional)"
  type        = string
  default     = ""
}

variable "openai_model" {
  description = "OpenAI model to use (e.g., gpt-3.5-turbo, gpt-4-turbo)"
  type        = string
  default     = "gpt-3.5-turbo"
}

variable "binance_api_key" {
  description = "Binance API key (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "binance_secret_key" {
  description = "Binance secret key (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "binance_testnet" {
  description = "Use Binance testnet (true/false)"
  type        = bool
  default     = true
}

variable "thenews_api_key" {
  description = "TheNewsAPI key for news feed"
  type        = string
  sensitive   = true
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

