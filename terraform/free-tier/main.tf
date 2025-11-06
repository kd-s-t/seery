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

# Security Group
resource "aws_security_group" "seer" {
  name        = "${var.environment}-seer-free-tier-sg"
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
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.seer.id]

  # Free tier eligible: 8GB GP3 EBS
  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  # User data script to bootstrap the instance
  user_data = templatefile("${path.module}/user-data.sh", {
    openai_api_key   = var.openai_api_key
    network          = var.network
    bnb_testnet_rpc  = var.bnb_testnet_rpc
    bnb_mainnet_rpc  = var.bnb_mainnet_rpc
    contract_address = var.contract_address
    repo_url         = var.repo_url != "" ? var.repo_url : ""
    repo_branch      = var.repo_branch
  }))

  # Enable detailed monitoring (optional, costs extra)
  monitoring = false

  tags = {
    Name        = "${var.environment}-seer-free-tier"
    Environment = var.environment
    Deployment  = "free-tier"
  }
}

# Elastic IP (optional, for static IP)
resource "aws_eip" "seer" {
  count    = var.allocate_elastic_ip ? 1 : 0
  instance = aws_instance.seer.id
  domain   = "vpc"

  tags = {
    Name        = "${var.environment}-seer-free-tier-eip"
    Environment = var.environment
  }
}

