# Free Tier EC2 Deployment

This Terraform configuration deploys Seer on AWS Free Tier using a single EC2 t2.micro instance with Docker Compose.

## Cost

- **Free Tier (First 12 Months)**: $0/month ✅
- **After Free Tier**: ~$9-12/month

## Architecture

- **1 EC2 t2.micro instance** (1 vCPU, 1GB RAM)
- **Docker Compose** running both Next.js and Express.js
- **8GB EBS storage** (within 30GB free tier limit)
- **No ALB, No ECS** (keeps costs minimal)

## Prerequisites

1. **AWS Account** with free tier eligibility
2. **AWS CLI** configured
3. **Terraform** >= 1.0
4. **SSH Key Pair** created in AWS EC2

## Quick Start

### 1. Create SSH Key Pair

```bash
# In AWS Console: EC2 > Key Pairs > Create key pair
# Or via CLI:
aws ec2 create-key-pair --key-name seer-free-tier --query 'KeyMaterial' --output text > seer-free-tier.pem
chmod 400 seer-free-tier.pem
```

### 2. Configure Variables

```bash
cd terraform/free-tier
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
aws_region  = "us-east-1"
environment = "dev"
instance_type = "t2.micro"

# IMPORTANT: Restrict SSH to your IP
ssh_allowed_cidrs = ["YOUR.IP.ADDRESS/32"]  # Get your IP: curl ifconfig.me

openai_api_key   = "sk-your-key-here"
contract_address = "0x..."

# Optional: Auto-deploy from Git
repo_url    = "https://github.com/your-username/seer.git"
repo_branch = "main"
```

### 3. Deploy

```bash
terraform init
terraform plan
terraform apply
```

### 4. Access Your Application

After deployment, get the URLs:

```bash
terraform output
```

Access:
- **Frontend**: `http://<public-ip>:3015`
- **API**: `http://<public-ip>:3016`

## Manual Deployment (if not using Git)

If you didn't set `repo_url`, you'll need to manually deploy:

```bash
# SSH into instance
ssh -i seer-free-tier.pem ec2-user@<public-ip>

# Clone your repository
cd /home/ec2-user
git clone https://github.com/your-username/seer.git
cd seer

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Start services
docker-compose up -d
```

## Monitoring

### Check Service Status

```bash
ssh -i seer-free-tier.pem ec2-user@<public-ip>
docker-compose ps
docker-compose logs
```

### View System Resources

```bash
# CPU and Memory
top
free -h

# Docker stats
docker stats
```

## Updating the Application

### Option 1: Via Git (if repo_url is set)

```bash
ssh -i seer-free-tier.pem ec2-user@<public-ip>
cd /home/ec2-user/seer
git pull
docker-compose build
docker-compose up -d
```

### Option 2: Manual Update

```bash
# SSH and update code
ssh -i seer-free-tier.pem ec2-user@<public-ip>
cd /home/ec2-user/seer

# Pull latest code or copy files
# Then rebuild and restart
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Out of Memory

```bash
# Check memory
free -h
docker stats

# Restart services
docker-compose restart
```

### Services Not Starting

```bash
# Check logs
docker-compose logs
journalctl -u docker

# Check disk space
df -h
```

### Cannot Access Application

1. Check security group allows ports 3015, 3016
2. Verify services are running: `docker-compose ps`
3. Check logs: `docker-compose logs`

## Security Best Practices

1. **Restrict SSH**: Set `ssh_allowed_cidrs` to your IP only
2. **Use Key Pairs**: Never use password authentication
3. **Keep Updated**: `yum update -y` regularly
4. **Firewall**: Security groups are configured
5. **Secrets**: API keys stored in `.env` file (not in code)

## Cost Breakdown

### Free Tier (First 12 Months)
- EC2 t2.micro: $0 (750 hours free)
- EBS Storage: $0 (30GB free)
- Data Transfer: $0 (15GB out free)
- **Total: $0/month** ✅

### After Free Tier Expires
- EC2 t2.micro: ~$8.50/month
- EBS Storage: ~$0.80/month (8GB)
- Data Transfer: Variable
- **Total: ~$9-12/month**

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

## Next Steps

1. **Setup Domain** (optional): Use No-IP or DuckDNS for free dynamic DNS
2. **Add Nginx** (optional): Reverse proxy for port 80/443
3. **Enable HTTPS** (optional): Use Let's Encrypt with nginx
4. **Monitor**: Set up CloudWatch alarms (free tier: 10 metrics)

## Comparison with ECS Fargate

| Feature | Free Tier EC2 | ECS Fargate |
|---------|---------------|-------------|
| **Cost (first year)** | $0 | ~$145/month |
| **Cost (after free tier)** | ~$10/month | ~$145/month |
| **Setup Complexity** | Simple | Complex |
| **Scalability** | Manual | Auto-scaling |
| **Best For** | MVP/Demo | Production |

For MVP/demo, **Free Tier EC2 is the way to go!** 🚀

