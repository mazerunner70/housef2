terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# GitHub OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"  # GitHub's OIDC token thumbprint
  ]
}

# IAM Role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name = "github-actions-terraform"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub": ["repo:${var.github_org}/${var.github_repo}:*", "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"]
          }
        }
      }
    ]
  })

  tags = {
    Name = "github-actions-terraform"
  }
}

# IAM Policy for Terraform operations
resource "aws_iam_role_policy" "terraform_policy" {
  name = "terraform-policy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:*",
          "dynamodb:*",
          "lambda:*",
          "apigateway:*",
          "cloudfront:*",
          "cognito-idp:*",
          "cognito-identity:*",
          "iam:*",
          "logs:*",
          "acm:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# Variables
variable "github_org" {
  description = "GitHub organization name"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

# Outputs
output "role_arn" {
  description = "ARN of the GitHub Actions IAM role"
  value       = aws_iam_role.github_actions.arn
} 