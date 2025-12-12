resource "aws_iam_role" "ec2_ecr_role" {
  name = "${var.environment}-seer-ec2-ecr-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.environment}-seer-ec2-ecr-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ec2_ecr_policy" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "ec2_ssm_policy" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_ecr_profile" {
  name = "${var.environment}-seer-ec2-ecr-profile"
  role = aws_iam_role.ec2_ecr_role.name

  tags = {
    Name        = "${var.environment}-seer-ec2-ecr-profile"
    Environment = var.environment
  }
}

