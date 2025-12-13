variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging, dev)"
  type        = string
  default     = "production"
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for Seery coin images"
  type        = string
  default     = "production-seer-coin-images"
}

variable "enable_versioning" {
  description = "Enable versioning on the S3 bucket"
  type        = bool
  default     = false
}

variable "allowed_origins" {
  description = "Allowed CORS origins for the S3 bucket"
  type        = list(string)
  default     = [
    "https://theseery.com",
    "http://localhost:3015",
    "https://seery-nextjs-hyxh.vercel.app"
  ]
}

variable "enable_lifecycle_policy" {
  description = "Enable lifecycle policy to auto-delete old objects (reduces costs)"
  type        = bool
  default     = false
}

variable "object_expiration_days" {
  description = "Number of days after which objects are automatically deleted (only if lifecycle policy is enabled)"
  type        = number
  default     = 365
}

variable "enable_intelligent_tiering" {
  description = "Enable S3 Intelligent-Tiering to automatically optimize storage costs (free tier eligible)"
  type        = bool
  default     = true
}
