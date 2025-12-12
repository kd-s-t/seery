variable "environment" {
  description = "Environment name (e.g., production, staging, dev)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "key_name" {
  description = "Name of the AWS EC2 Key Pair for SSH access"
  type        = string
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH"
  type        = list(string)
}

variable "allocate_elastic_ip" {
  description = "Allocate an Elastic IP for static IP address"
  type        = bool
  default     = false
}

variable "instance_profile_name" {
  description = "IAM instance profile name"
  type        = string
}

variable "user_data_script_path" {
  description = "Path to user data script"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "blockchain_network" {
  description = "BNB Chain network (testnet or mainnet)"
  type        = string
}

variable "blockchain_rpc" {
  description = "BNB Chain RPC URL"
  type        = string
}

variable "blockchain_contract_address" {
  description = "Deployed PredictionMarket contract address"
  type        = string
}

variable "blockchain_private_key" {
  description = "Private key for automated blockchain transactions"
  type        = string
  sensitive   = true
  default     = ""
}

variable "blockchain_wallet_address" {
  description = "Wallet address for blockchain transactions"
  type        = string
  default     = ""
}

variable "backend_domain" {
  description = "Backend API domain URL"
  type        = string
}

variable "openai_model" {
  description = "OpenAI model to use"
  type        = string
}

variable "binance_api_key" {
  description = "Binance API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "binance_secret_key" {
  description = "Binance secret key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "binance_testnet" {
  description = "Use Binance testnet (true/false)"
  type        = bool
}

variable "thenews_api_key" {
  description = "TheNewsAPI key for news feed"
  type        = string
  sensitive   = true
  default     = ""
}

variable "repo_url" {
  description = "Git repository URL to clone"
  type        = string
  default     = ""
}

variable "repo_branch" {
  description = "Git branch to checkout"
  type        = string
}

