terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Security module
module "security" {
  source = "./modules/security"

  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = data.aws_availability_zones.available.names
}

# S3 module
module "s3" {
  source = "./modules/s3"

  environment = var.environment
  account_id  = data.aws_caller_identity.current.account_id
}

# IAM module
module "iam" {
  source = "./modules/iam"

  environment   = var.environment
  aws_region    = var.aws_region
  account_id    = data.aws_caller_identity.current.account_id
  s3_bucket_arn = module.s3.bucket_arn
}

# ECR module
module "ecr" {
  source = "./modules/ecr"

  environment = var.environment
}

# ECS module
module "ecs" {
  source = "./modules/ecs"

  environment           = var.environment
  aws_region            = var.aws_region
  vpc_id                = module.security.vpc_id
  public_subnet_ids     = module.security.public_subnet_ids
  private_subnet_ids    = module.security.private_subnet_ids
  security_group_id     = module.security.security_group_id
  alb_security_group_id = module.security.alb_security_group_id

  # ECR repositories
  expressjs_repository_url = module.ecr.expressjs_repository_url
  nextjs_repository_url    = module.ecr.nextjs_repository_url

  # Task execution role
  task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  task_role_arn           = module.iam.ecs_task_role_arn

  # Environment variables
  openai_api_key   = var.openai_api_key
  network          = var.network
  bnb_testnet_rpc  = var.bnb_testnet_rpc
  bnb_mainnet_rpc  = var.bnb_mainnet_rpc
  contract_address = var.contract_address

  # Domain configuration
  domain_name     = var.domain_name
  certificate_arn = var.certificate_arn

  # Container configuration
  expressjs_cpu    = var.expressjs_cpu
  expressjs_memory = var.expressjs_memory
  nextjs_cpu       = var.nextjs_cpu
  nextjs_memory    = var.nextjs_memory

  # Account ID for SSM parameter
  account_id = data.aws_caller_identity.current.account_id

  # S3 bucket
  s3_bucket_name = module.s3.bucket_name

  depends_on = [
    module.security,
    module.iam,
    module.ecr,
    module.s3
  ]
}

