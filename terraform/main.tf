terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

module "iam_ec2" {
  source = "./modules/iam/ec2"

  environment = var.environment
}

module "ec2" {
  source = "./modules/ec2"

  environment        = var.environment
  instance_type      = var.instance_type
  key_name           = var.key_name
  ssh_allowed_cidrs  = var.ssh_allowed_cidrs
  allocate_elastic_ip = var.allocate_elastic_ip
  instance_profile_name = module.iam_ec2.instance_profile_name
  user_data_script_path = "${path.module}/scripts/user-data.sh"

  aws_account_id = data.aws_caller_identity.current.account_id
  aws_region     = data.aws_region.current.name

  openai_api_key            = var.openai_api_key
  blockchain_network       = var.blockchain_network
  blockchain_rpc            = var.blockchain_rpc
  blockchain_contract_address = var.blockchain_contract_address
  blockchain_private_key    = var.blockchain_private_key
  blockchain_wallet_address = var.blockchain_wallet_address
  backend_domain           = var.backend_domain
  openai_model             = var.openai_model
  binance_api_key          = var.binance_api_key
  binance_secret_key       = var.binance_secret_key
  binance_testnet          = var.binance_testnet
  thenews_api_key          = var.thenews_api_key
  repo_url                 = var.repo_url
  repo_branch              = var.repo_branch
}
