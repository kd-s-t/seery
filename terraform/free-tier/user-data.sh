#!/bin/bash
# Bootstrap script for Seer free tier EC2 instance
# This script installs Docker, Docker Compose, and sets up the application

set -e

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git (if not already installed)
yum install -y git

# Install AWS CLI (optional, for ECR access if needed)
yum install -y unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Add swap space (2GB) for memory optimization
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Clone repository (if repo_url is provided)
if [ -n "${repo_url}" ]; then
  cd /home/ec2-user
  git clone -b ${repo_branch} ${repo_url} seer || echo "Repository clone failed or already exists"
  cd seer || exit 1
else
  # Create directory structure if no repo
  mkdir -p /home/ec2-user/seer
  cd /home/ec2-user/seer
fi

# Create docker-compose.yml for production
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  expressjs:
    build:
      context: ./expressjs
      dockerfile: Dockerfile
    ports:
      - "3016:3016"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - PORT=3016
      - NETWORK=${NETWORK}
      - BNB_TESTNET_RPC=${BNB_TESTNET_RPC}
      - BNB_MAINNET_RPC=${BNB_MAINNET_RPC}
      - CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
    restart: unless-stopped
    volumes:
      - ./expressjs:/app
    working_dir: /app

  nextjs:
    build:
      context: ./nextjs
      dockerfile: Dockerfile
    ports:
      - "3015:3015"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3016
      - PORT=3015
      - NODE_ENV=production
    restart: unless-stopped
    depends_on:
      - expressjs
    volumes:
      - ./nextjs:/app
      - /app/node_modules
      - /app/.next
EOF

# Create .env file with environment variables
cat > .env <<EOF
OPENAI_API_KEY=${openai_api_key}
NETWORK=${network}
BNB_TESTNET_RPC=${bnb_testnet_rpc}
BNB_MAINNET_RPC=${bnb_mainnet_rpc}
CONTRACT_ADDRESS=${contract_address}
EOF

# Set proper permissions
chown -R ec2-user:ec2-user /home/ec2-user/seer
chmod 600 /home/ec2-user/seer/.env

# Build and start services (run as ec2-user)
sudo -u ec2-user bash <<'USERSCRIPT'
cd /home/ec2-user/seer
docker-compose build
docker-compose up -d
USERSCRIPT

# Log completion
echo "Seer deployment completed at $(date)" >> /var/log/seer-deployment.log

