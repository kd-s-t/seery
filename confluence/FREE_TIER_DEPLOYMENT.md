# Free Tier EC2 Deployment Plan

## Overview

Deploy Seer on AWS Free Tier using 2 EC2 instances (t2.micro) - one for backend (Express.js) and one for frontend (Next.js). This keeps costs at $0/month for the first year.

## Architecture

```
┌─────────────────────────────────────────┐
│     Internet / Your Domain              │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │  EC2 Instance 1 │
        │  (Next.js)      │
        │  t2.micro        │
        │  Port: 3015      │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  EC2 Instance 2 │
        │  (Express.js)   │
        │  t2.micro        │
        │  Port: 3016      │
        └──────────────────┘
```

## AWS Free Tier Limits

### EC2 Free Tier (First 12 Months)
- **750 hours/month** of t2.micro or t3.micro instances
- **2 instances** = 2 × 730 hours = 1,460 hours/month
- **Free tier covers**: 750 hours/month
- **You'll use**: 1,460 hours/month
- **Cost**: ~$7-10/month for the extra hours (still very cheap!)

**OR use 1 instance** and run both services on it = **$0/month** ✅

### Other Free Tier Resources
- **EBS Storage**: 30GB free (enough for both instances)
- **Data Transfer**: 15GB out free
- **CloudWatch**: 10 custom metrics, 5GB logs free

## Recommended: Single Instance Setup

**Best approach**: Use 1 t2.micro instance running both services with Docker Compose.

### Why Single Instance?
- ✅ **$0/month** (stays within free tier)
- ✅ Simpler setup
- ✅ Easier to manage
- ✅ Sufficient for MVP/demo

### When to Use 2 Instances?
- If you need separation
- If you have higher traffic
- After free tier expires (still cheap: ~$7-10/month)

## Single Instance Architecture

```
┌─────────────────────────────────────────┐
│     Internet / Your Domain              │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │  EC2 Instance   │
        │  t2.micro        │
        │                  │
        │  Docker Compose  │
        │  ├─ Next.js      │
        │  │  Port: 3015   │
        │  └─ Express.js   │
        │     Port: 3016   │
        └──────────────────┘
```

## Infrastructure Setup

### 1. EC2 Instance
- **Type**: t2.micro (1 vCPU, 1GB RAM)
- **AMI**: Amazon Linux 2023 (free tier eligible)
- **Storage**: 8GB GP3 EBS (free tier: 30GB)
- **Security Group**: Allow HTTP (80), HTTPS (443), SSH (22)

### 2. User Data Script

```bash
#!/bin/bash
# Bootstrap script for EC2 instance

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

# Install AWS CLI
yum install -y unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Configure ECR login (if using ECR)
# aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create docker-compose.yml
cat > /home/ec2-user/docker-compose.yml <<'EOF'
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
      - NETWORK=testnet
      - BNB_TESTNET_RPC=${BNB_TESTNET_RPC}
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

# Clone repository (or use your deployment method)
# git clone https://github.com/your-username/seer.git /home/ec2-user/seer

# Set environment variables
cat > /home/ec2-user/.env <<'EOF'
OPENAI_API_KEY=your-key-here
BNB_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
CONTRACT_ADDRESS=0x...
EOF

# Start services
cd /home/ec2-user
docker-compose up -d
```

## Deployment Steps

### Option 1: Manual Deployment

1. **Launch EC2 Instance**
   ```bash
   # Via AWS Console or CLI
   aws ec2 run-instances \
     --image-id ami-0c55b159cbfafe1f0 \
     --instance-type t2.micro \
     --key-name your-key-pair \
     --security-group-ids sg-xxxxx \
     --user-data file://user-data.sh
   ```

2. **SSH into Instance**
   ```bash
   ssh -i your-key.pem ec2-user@<instance-ip>
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/seer.git
   cd seer
   ```

4. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

5. **Start Services**
   ```bash
   docker-compose up -d
   ```

### Option 2: Using Terraform (Simple)

```hcl
# terraform/free-tier/main.tf

resource "aws_instance" "seer" {
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2023
  instance_type = "t2.micro"
  
  vpc_security_group_ids = [aws_security_group.seer.id]
  
  user_data = file("${path.module}/user-data.sh")
  
  tags = {
    Name = "seer-free-tier"
  }
}

resource "aws_security_group" "seer" {
  name = "seer-free-tier-sg"
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict to your IP in production
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

## Cost Breakdown

### Free Tier (First 12 Months)
```
EC2 t2.micro:      $0/month (750 hours free)
EBS Storage:       $0/month (30GB free)
Data Transfer:     $0/month (15GB out free)
─────────────────────────
TOTAL:             $0/month ✅
```

### After Free Tier Expires
```
EC2 t2.micro:      ~$8.50/month (730 hours)
EBS Storage:       ~$0.80/month (8GB)
Data Transfer:     Variable
─────────────────────────
TOTAL:             ~$9-12/month
```

**Still way cheaper than Fargate ($145/month) or EKS ($218/month)!**

## Limitations & Considerations

### t2.micro Limitations
- **1 vCPU**: Limited processing power
- **1GB RAM**: Can be tight for both services
- **Burstable**: CPU credits can run out under load

### Recommendations
1. **Optimize Docker images**: Use multi-stage builds, smaller base images
2. **Monitor CPU credits**: Use CloudWatch to track burst credits
3. **Consider t3.micro**: After free tier, t3.micro has better performance
4. **Use swap space**: Add swap if memory is tight

### Memory Optimization
```bash
# Add swap space (2GB)
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Accessing Your Application

### Option 1: Direct IP
- Access via: `http://<ec2-public-ip>:3015` (Next.js)
- API: `http://<ec2-public-ip>:3016` (Express.js)

### Option 2: Domain Name (Free)
- Use **No-IP** or **DuckDNS** for free dynamic DNS
- Point domain to EC2 public IP
- Use nginx as reverse proxy

### Option 3: AWS Route 53 (Paid)
- Register domain (~$12/year)
- Create A record pointing to EC2 IP
- Use nginx for HTTPS

## Nginx Reverse Proxy (Optional)

If you want to use port 80/443:

```nginx
# /etc/nginx/conf.d/seer.conf

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3015;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3016;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring

### CloudWatch (Free Tier)
- **10 custom metrics** free
- **5GB logs** free
- Monitor CPU, memory, disk

### Simple Monitoring Script
```bash
#!/bin/bash
# monitor.sh

while true; do
    echo "$(date): CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
    echo "$(date): Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')"
    sleep 60
done
```

## Backup Strategy

### Simple Backup
```bash
#!/bin/bash
# backup.sh - Run daily via cron

DATE=$(date +%Y%m%d)
tar -czf /home/ec2-user/backup-$DATE.tar.gz \
    /home/ec2-user/seer \
    /home/ec2-user/.env

# Upload to S3 (free tier: 5GB)
aws s3 cp /home/ec2-user/backup-$DATE.tar.gz \
    s3://your-bucket/backups/
```

## Security Best Practices

1. **Restrict SSH**: Only allow your IP
2. **Use key pairs**: Never use password authentication
3. **Keep updated**: `yum update -y` regularly
4. **Firewall**: Use security groups properly
5. **Secrets**: Store API keys in environment variables, not in code

## Troubleshooting

### Out of Memory
```bash
# Check memory usage
free -h
docker stats

# Restart services
docker-compose restart
```

### CPU Credits Exhausted
- t2.micro has burstable CPU
- If credits run out, CPU is throttled
- Solution: Upgrade to t3.micro or optimize code

### Services Not Starting
```bash
# Check logs
docker-compose logs
journalctl -u docker

# Check disk space
df -h
```

## Next Steps

1. **Launch EC2 instance** (t2.micro)
2. **Configure security group** (ports 22, 80, 443, 3015, 3016)
3. **SSH and setup** (run user-data script or manual)
4. **Deploy code** (git clone or S3)
5. **Start services** (docker-compose up -d)
6. **Test** (access via public IP)
7. **Optional**: Setup domain and nginx

## Cost Comparison

| Option | Monthly Cost | Notes |
|--------|--------------|-------|
| **Free Tier EC2** | **$0** | First 12 months ✅ |
| ECS Fargate | $145 | Too expensive |
| EKS | $218 | Way too expensive |
| EC2 (after free tier) | $9-12 | Still cheap |

## Conclusion

**For Seer MVP/Demo**: Use 1 t2.micro instance with Docker Compose. It's free for the first year and only ~$10/month after that.

**This is the cheapest way to deploy Seer on AWS!**

