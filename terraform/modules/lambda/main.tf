terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# Build process
resource "null_resource" "lambda_build" {
  triggers = {
    source_code = filebase64sha256("${path.module}/../../../backend/src/handlers/import.ts")
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../../../backend"
    command     = <<EOT
      rm -rf dist
      npm install
      npm run build
      rm -f dist/lambda.zip
      cd dist && zip -r lambda.zip . -x "*.map" "*.test.js" "*.test.js.map"
    EOT
  }
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# CloudWatch Logs policy
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB access policy
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.project_name}-${var.environment}-lambda-dynamodb"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.import_table_name}"
        ]
      }
    ]
  })
}

# S3 access policy
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${var.project_name}-${var.environment}-lambda-s3"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.import_bucket_name}",
          "arn:aws:s3:::${var.import_bucket_name}/*"
        ]
      }
    ]
  })
}

locals {
  source_code_hash = filebase64sha256(var.lambda_zip_path)
}

# Lambda functions
resource "aws_lambda_function" "account_api" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-${var.environment}-account-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "account.getAccount"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = local.source_code_hash

  environment {
    variables = {
      MAIN_TABLE_NAME = var.import_table_name
    }
  }

  depends_on = [null_resource.lambda_build]
}

resource "aws_lambda_function" "transaction_api" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-${var.environment}-transaction-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "transaction.getTransactions"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = local.source_code_hash

  environment {
    variables = {
      MAIN_TABLE_NAME = var.import_table_name
    }
  }

  depends_on = [null_resource.lambda_build]
}

# Import functions module
module "import_functions" {
  source = "./functions"

  project_name = var.project_name
  environment = var.environment
  lambda_zip_path = var.lambda_zip_path
  lambda_role_arn = aws_iam_role.lambda_role.arn
  lambda_build = null_resource.lambda_build
  import_bucket_name = var.import_bucket_name
  import_table_name = var.import_table_name
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset([
    "housef2-dev-account-api",
    "housef2-dev-transaction-api",
    "housef2-dev-get-upload-url",
    "housef2-dev-get-imports",
    "housef2-dev-get-import-analysis",
    "housef2-dev-confirm-import",
    "housef2-dev-handle-wrong-account",
    "housef2-dev-delete-import"
  ])

  name              = "/aws/lambda/${each.key}"
  retention_in_days = 14
}

# Outputs
output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
}

output "lambda_build" {
  description = "The lambda_build resource"
  value       = null_resource.lambda_build
} 