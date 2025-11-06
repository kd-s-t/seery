#!/bin/bash

# Script to build and push Docker images to ECR
# Usage: ./scripts/build-and-push-images.sh [environment] [aws-region]

set -e

ENVIRONMENT=${1:-production}
AWS_REGION=${2:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ -z "$AWS_ACCOUNT_ID" ]; then
  echo "Error: Could not get AWS account ID. Make sure AWS CLI is configured."
  exit 1
fi

echo "Building and pushing images for environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "AWS Account ID: $AWS_ACCOUNT_ID"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Express.js
EXPRESSJS_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ENVIRONMENT}-seer-expressjs"
echo "Building Express.js image..."
cd ../expressjs
docker build -t ${ENVIRONMENT}-seer-expressjs:latest .
docker tag ${ENVIRONMENT}-seer-expressjs:latest $EXPRESSJS_REPO:latest
echo "Pushing Express.js image..."
docker push $EXPRESSJS_REPO:latest
echo "✓ Express.js image pushed"

# Next.js
NEXTJS_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ENVIRONMENT}-seer-nextjs"
echo "Building Next.js image..."
cd ../nextjs
docker build -t ${ENVIRONMENT}-seer-nextjs:latest .
docker tag ${ENVIRONMENT}-seer-nextjs:latest $NEXTJS_REPO:latest
echo "Pushing Next.js image..."
docker push $NEXTJS_REPO:latest
echo "✓ Next.js image pushed"

echo ""
echo "✓ All images built and pushed successfully!"
echo ""
echo "Express.js: $EXPRESSJS_REPO:latest"
echo "Next.js: $NEXTJS_REPO:latest"

