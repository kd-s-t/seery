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

resource "aws_s3_bucket" "seery_coin_images" {
  bucket = var.s3_bucket_name

  tags = {
    Name        = var.s3_bucket_name
    Environment = var.environment
    Project     = "Seery"
  }
}

resource "aws_s3_bucket_versioning" "seery_coin_images" {
  bucket = aws_s3_bucket.seery_coin_images.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "seery_coin_images" {
  bucket = aws_s3_bucket.seery_coin_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "seery_coin_images" {
  bucket = aws_s3_bucket.seery_coin_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "seery_coin_images" {
  bucket = aws_s3_bucket.seery_coin_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "seery_coin_images" {
  count  = var.enable_lifecycle_policy ? 1 : 0
  bucket = aws_s3_bucket.seery_coin_images.id

  rule {
    id     = "delete_old_objects"
    status = "Enabled"

    filter {}

    expiration {
      days = var.object_expiration_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
