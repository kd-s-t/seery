# Terraform Deployment Guide for Seer

This Terraform configuration deploys the Seer prediction market platform to AWS using ECS Fargate (serverless containers).

## Architecture

The deployment includes:

- **VPC**: Isolated network with public and private subnets
- **ECS Fargate**: Serverless container orchestration
- **ECR**: Docker image repositories for Express.js and Next.js
- **Application Load Balancer**: Routes traffic to services
- **CloudWatch**: Logging and monitoring
- **SSM Parameter Store**: Secure storage for API keys

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Terraform** >= 1.0 installed
4. **Docker** installed (for building images)
5. **Deployed Smart Contract** on BNB Chain (contract address)

## Setup

### 1. Configure AWS Credentials

```bash
aws configure
```

Or set environment variables:
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### 2. Configure Terraform Variables

Copy the example variables file and edit it:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
aws_region      = "us-east-1"
environment     = "production"
openai_api_key  = "sk-your-openai-api-key"
contract_address = "0x..."  # Your deployed contract address
```

### 3. Build and Push Docker Images

Before deploying, you need to build and push your Docker images to ECR.

#### Get ECR Login Token

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

#### Build and Push Express.js Image

```bash
cd ../expressjs
docker build -t production-seer-expressjs:latest .
docker tag production-seer-expressjs:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/production-seer-expressjs:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/production-seer-expressjs:latest
```

#### Build and Push Next.js Image

```bash
cd ../nextjs
docker build -t production-seer-nextjs:latest .
docker tag production-seer-nextjs:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/production-seer-nextjs:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/production-seer-nextjs:latest
```

**Note**: Replace `<account-id>` with your AWS account ID. You can get it after running `terraform init` and `terraform plan` to see the ECR repository URLs.

Alternatively, you can use the provided script:

```bash
./scripts/build-and-push-images.sh
```

## Deployment

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Review the Plan

```bash
terraform plan
```

This will show you what resources will be created. Review carefully.

### 3. Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted. This will create:
- VPC and networking resources
- ECR repositories
- ECS cluster and services
- Application Load Balancer
- Security groups
- IAM roles

### 4. Get Deployment Outputs

After deployment, get the URLs:

```bash
terraform output
```

You'll see:
- `alb_dns_name`: The load balancer DNS name
- `nextjs_service_url`: Frontend URL
- `expressjs_service_url`: Backend API URL

## Accessing the Application

After deployment, access your application at:

- **Frontend**: `http://<alb_dns_name>` (or your domain if configured)
- **Backend API**: `http://<alb_dns_name>/api`

## HTTPS Setup (Optional)

To enable HTTPS:

1. **Request an ACM Certificate** (if you have a domain):

```bash
aws acm request-certificate \
  --domain-name seer.example.com \
  --validation-method DNS \
  --region us-east-1
```

2. **Validate the certificate** by adding DNS records to your domain

3. **Update terraform.tfvars**:

```hcl
domain_name     = "seer.example.com"
certificate_arn = "arn:aws:acm:us-east-1:...:certificate/..."
```

4. **Apply the changes**:

```bash
terraform apply
```

## Updating the Application

### Update Docker Images

1. Build new images with updated code
2. Push to ECR (same process as initial deployment)
3. Force ECS service update:

```bash
aws ecs update-service \
  --cluster production-seer-cluster \
  --service production-seer-expressjs \
  --force-new-deployment \
  --region us-east-1

aws ecs update-service \
  --cluster production-seer-cluster \
  --service production-seer-nextjs \
  --force-new-deployment \
  --region us-east-1
```

### Update Environment Variables

Edit `terraform.tfvars` and run:

```bash
terraform apply
```

## Monitoring

### View Logs

```bash
# Express.js logs
aws logs tail /ecs/production-seer-expressjs --follow

# Next.js logs
aws logs tail /ecs/production-seer-nextjs --follow
```

### View ECS Services

```bash
aws ecs list-services --cluster production-seer-cluster
aws ecs describe-services --cluster production-seer-cluster --services production-seer-expressjs production-seer-nextjs
```

## Scaling

To scale services, update the `desired_count` in `modules/ecs/main.tf`:

```hcl
resource "aws_ecs_service" "expressjs" {
  desired_count = 2  # Increase from 1
  # ...
}
```

Or use AWS Console/CLI to update service count.

## Cost Estimation

Approximate monthly costs (us-east-1):

- **ECS Fargate** (2 tasks, 1.5 vCPU, 3GB RAM): ~$50-70
- **Application Load Balancer**: ~$20
- **NAT Gateway** (2): ~$65
- **Data Transfer**: Variable
- **CloudWatch Logs**: ~$5-10

**Total**: ~$140-165/month (without data transfer)

## Troubleshooting

### Services Not Starting

1. Check CloudWatch logs for errors
2. Verify ECR images are pushed correctly
3. Check security group rules
4. Verify environment variables are set correctly

### Cannot Access Application

1. Check ALB security group allows HTTP/HTTPS from your IP
2. Verify target groups are healthy
3. Check ECS tasks are running: `aws ecs list-tasks --cluster production-seer-cluster`

### Image Pull Errors

1. Verify ECR repository exists
2. Check IAM roles have ECR permissions
3. Verify image tags match task definition

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all resources including ECR images. Make sure you have backups if needed.

## Security Best Practices

1. **Never commit `terraform.tfvars`** to version control
2. **Use AWS Secrets Manager** for sensitive data (instead of SSM Parameter Store)
3. **Enable VPC Flow Logs** for network monitoring
4. **Use WAF** on ALB for DDoS protection
5. **Enable CloudTrail** for audit logging
6. **Regularly update** Docker images with security patches

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [ECS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)

## Support

For issues or questions, please open an issue in the repository.

