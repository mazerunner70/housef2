# IAM policy for Cognito management
resource "aws_iam_policy" "cognito_management" {
  name        = "${var.project_name}-${local.environment}-cognito-management"
  description = "Policy for managing Cognito resources"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:CreateUserPool",
          "cognito-idp:DeleteUserPool",
          "cognito-idp:DescribeUserPool",
          "cognito-idp:UpdateUserPool",
          "cognito-idp:CreateUserPoolClient",
          "cognito-idp:DeleteUserPoolClient",
          "cognito-idp:UpdateUserPoolClient",
          "cognito-identity:CreateIdentityPool",
          "cognito-identity:DeleteIdentityPool",
          "cognito-identity:DescribeIdentityPool",
          "cognito-identity:UpdateIdentityPool"
        ]
        Resource = "*"
      }
    ]
  })
} 