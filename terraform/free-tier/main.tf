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

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# IAM role for EC2 to pull from ECR
resource "aws_iam_role" "ec2_ecr_role" {
  name = "${var.environment}-seer-ec2-ecr-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.environment}-seer-ec2-ecr-role"
    Environment = var.environment
  }
}

# Attach ECR read-only policy
resource "aws_iam_role_policy_attachment" "ec2_ecr_policy" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Attach SSM managed instance core policy for GitHub Actions deployment
resource "aws_iam_role_policy_attachment" "ec2_ssm_policy" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile
resource "aws_iam_instance_profile" "ec2_ecr_profile" {
  name = "${var.environment}-seer-ec2-ecr-profile"
  role = aws_iam_role.ec2_ecr_role.name

  tags = {
    Name        = "${var.environment}-seer-ec2-ecr-profile"
    Environment = var.environment
  }
}

# Security Group
resource "aws_security_group" "seer" {
  name        = "${var.environment}-seer-free-tier-sg-${substr(md5(timestamp()), 0, 4)}"
  description = "Security group for Seer free tier EC2 instance"

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # Next.js
  ingress {
    from_port   = 3015
    to_port     = 3015
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Next.js frontend"
  }

  # Express.js API
  ingress {
    from_port   = 3016
    to_port     = 3016
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Express.js API"
  }

  # SSH (restrict to your IP in production)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
    description = "SSH"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound"
  }

  tags = {
    Name        = "${var.environment}-seer-free-tier-sg"
    Environment = var.environment
  }
}

# EC2 Instance
resource "aws_instance" "seer" {
  ami                  = data.aws_ami.amazon_linux.id
  instance_type        = var.instance_type
  key_name             = var.key_name
  iam_instance_profile = aws_iam_instance_profile.ec2_ecr_profile.name

  vpc_security_group_ids = [aws_security_group.seer.id]

  # Free tier eligible: 30GB GP3 EBS (minimum for Amazon Linux 2023)
  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }

  # User data script to bootstrap the instance
  user_data = templatefile("${path.module}/user-data.sh", {
    AWS_ACCOUNT_ID            = data.aws_caller_identity.current.account_id
    AWS_REGION                = data.aws_region.current.name
    OPENAI_API_KEY            = var.openai_api_key
    NETWORK                   = var.blockchain_network
    BLOCKCHAIN_RPC            = var.blockchain_rpc
    CONTRACT_ADDRESS          = var.blockchain_contract_address
    BLOCKCHAIN_PRIVATE_KEY    = var.blockchain_private_key
    BLOCKCHAIN_WALLET_ADDRESS = var.blockchain_wallet_address != "" ? var.blockchain_wallet_address : var.blockchain_contract_address
    BACKEND_DOMAIN            = var.backend_domain
    openai_api_key            = var.openai_api_key
    network                   = var.blockchain_network
    blockchain_rpc            = var.blockchain_rpc
    contract_address          = var.blockchain_contract_address
    blockchain_private_key    = var.blockchain_private_key
    blockchain_wallet_address = var.blockchain_wallet_address != "" ? var.blockchain_wallet_address : var.blockchain_contract_address
    backend_domain            = var.backend_domain
    openai_model              = var.openai_model
    binance_api_key           = var.binance_api_key
    binance_secret_key        = var.binance_secret_key
    binance_testnet           = var.binance_testnet ? "true" : "false"
    thenews_api_key           = var.thenews_api_key
    repo_url                  = var.repo_url != "" ? var.repo_url : ""
    repo_branch               = var.repo_branch
  })

  # Enable detailed monitoring (optional, costs extra)
  monitoring = false

  # Prevent accidental termination
  disable_api_termination = true

  tags = {
    Name        = "seery-testnet"
    Environment = var.environment
    Deployment  = "free-tier"
    Frontend    = "seery-testnet-fe"
    Backend     = "seery-testnet-be"
  }
}

# Elastic IP (optional, for static IP)
resource "aws_eip" "seer" {
  count    = var.allocate_elastic_ip ? 1 : 0
  instance = aws_instance.seer.id
  domain   = "vpc"

  tags = {
    Name        = "seery-testnet-eip"
    Environment = var.environment
  }
}

# EventBridge API Destination for HTTP endpoint
resource "aws_cloudwatch_event_api_destination" "auto_resolve" {
  name                             = "${var.environment}-seery-auto-resolve-api"
  description                      = "API destination for auto-resolve endpoint"
  invocation_endpoint              = "http://${var.allocate_elastic_ip ? aws_eip.seer[0].public_ip : aws_instance.seer.public_ip}:3016/api/staking/auto-resolve"
  http_method                      = "POST"
  invocation_rate_limit_per_second = 1
  connection_arn                  = aws_cloudwatch_event_connection.auto_resolve.arn
}

# EventBridge Connection for API Destination
resource "aws_cloudwatch_event_connection" "auto_resolve" {
  name               = "${var.environment}-seery-auto-resolve-connection"
  description        = "Connection for auto-resolve API destination"
  authorization_type = "API_KEY"

  auth_parameters {
    api_key {
      key   = "X-API-Key"
      value = "seery-auto-resolve"
    }
  }
}

# EventBridge Rule for auto-resolving expired stakes
# Cost: FREE (EventBridge rules are free, only custom events cost $1/million)
resource "aws_cloudwatch_event_rule" "auto_resolve_stakes" {
  name                = "${var.environment}-seery-auto-resolve"
  description         = "Auto-resolve expired stakes every hour"
  schedule_expression = "rate(1 hour)"

  tags = {
    Name        = "${var.environment}-seery-auto-resolve"
    Environment = var.environment
  }
}

# EventBridge Target - API Destination
resource "aws_cloudwatch_event_target" "auto_resolve_target" {
  rule      = aws_cloudwatch_event_rule.auto_resolve_stakes.name
  target_id = "AutoResolveStakes"
  arn       = aws_cloudwatch_event_api_destination.auto_resolve.arn

  http_parameters {
    header_parameters = {
      "Content-Type" = "application/json"
    }
  }
}

