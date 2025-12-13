output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.seery_coin_images.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.seery_coin_images.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.seery_coin_images.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.seery_coin_images.bucket_regional_domain_name
}
