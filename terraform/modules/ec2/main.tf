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

resource "aws_security_group" "seer" {
  name        = "${var.environment}-seer-free-tier-sg-${substr(md5(timestamp()), 0, 4)}"
  description = "Security group for Seer free tier EC2 instance"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  ingress {
    from_port   = 3015
    to_port     = 3015
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Next.js frontend"
  }

  ingress {
    from_port   = 3016
    to_port     = 3016
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Express.js API"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
    description = "SSH"
  }

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

resource "aws_instance" "seer" {
  ami                  = data.aws_ami.amazon_linux.id
  instance_type        = var.instance_type
  key_name             = var.key_name
  iam_instance_profile = var.instance_profile_name

  vpc_security_group_ids = [aws_security_group.seer.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }

  user_data = templatefile("${var.user_data_script_path}", {
    AWS_ACCOUNT_ID            = var.aws_account_id
    AWS_REGION                = var.aws_region
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

  monitoring = false
  disable_api_termination = true

  tags = {
    Name        = "seery-testnet"
    Environment = var.environment
    Deployment  = "free-tier"
    Frontend    = "seery-testnet-fe"
    Backend     = "seery-testnet-be"
  }
}

resource "aws_eip" "seer" {
  count    = var.allocate_elastic_ip ? 1 : 0
  instance = aws_instance.seer.id
  domain   = "vpc"

  tags = {
    Name        = "seery-testnet-eip"
    Environment = var.environment
  }
}

