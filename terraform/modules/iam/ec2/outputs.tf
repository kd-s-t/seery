output "iam_role_name" {
  description = "IAM role name for EC2 instance"
  value       = aws_iam_role.ec2_ecr_role.name
}

output "instance_profile_name" {
  description = "IAM instance profile name"
  value       = aws_iam_instance_profile.ec2_ecr_profile.name
}

