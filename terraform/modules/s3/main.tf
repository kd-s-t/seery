resource "aws_s3_bucket" "coin_images" {
  bucket = "${var.environment}-seer-coin-images-${var.account_id}"

  tags = {
    Name        = "${var.environment}-seer-coin-images-${var.account_id}"
    Environment = var.environment
    Project     = "Seer"
  }
}

resource "aws_s3_bucket_versioning" "coin_images" {
  bucket = aws_s3_bucket.coin_images.id
  versioning_configuration {
    status = "Disabled"
  }
}

resource "aws_s3_bucket_public_access_block" "coin_images" {
  bucket = aws_s3_bucket.coin_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "coin_images" {
  bucket = aws_s3_bucket.coin_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.coin_images.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.coin_images]
}

resource "aws_s3_bucket_cors_configuration" "coin_images" {
  bucket = aws_s3_bucket.coin_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "coin_images" {
  bucket = aws_s3_bucket.coin_images.id

  rule {
    id     = "delete_old_versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

