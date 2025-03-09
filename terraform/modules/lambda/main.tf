# Build process
resource "null_resource" "lambda_build" {
  triggers = {
    source_code = sha256(join("", [for f in fileset("${path.module}/../../../backend/src", "**/*"): filesha256("${path.module}/../../../backend/src/${f}")]))
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../../../backend"
    command     = <<EOT
      npm install
      npm run build
      rm -f dist/lambda.zip
      cd dist && zip -r lambda.zip .
    EOT
  }
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"
  depends_on = [null_resource.lambda_build]  # Ensure build completes before creating Lambda

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
  name = "${var.project_name}-lambda-dynamodb"
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
          var.main_table_arn,
          var.import_status_table_arn
        ]
      }
    ]
  })
}

# S3 access policy
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${var.project_name}-lambda-s3"
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
          var.transaction_files_bucket_arn,
          "${var.transaction_files_bucket_arn}/*"
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
  function_name    = "${var.project_name}-account-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  depends_on      = [null_resource.lambda_build]  # Ensure build completes before creating Lambda

  environment {
    variables = {
      MAIN_TABLE = var.main_table_name
      ENVIRONMENT = var.environment
    }
  }

  source_code_hash = local.source_code_hash
}

resource "aws_lambda_function" "transaction_api" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-transaction-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  depends_on      = [null_resource.lambda_build]  # Ensure build completes before creating Lambda

  environment {
    variables = {
      MAIN_TABLE = var.main_table_name
      ENVIRONMENT = var.environment
    }
  }

  source_code_hash = local.source_code_hash
}

resource "aws_lambda_function" "import_upload" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-import-upload"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  depends_on      = [null_resource.lambda_build]  # Ensure build completes before creating Lambda

  environment {
    variables = {
      IMPORT_STATUS_TABLE = var.import_status_table_name
      TRANSACTION_FILES_BUCKET = var.transaction_files_bucket_name
      ENVIRONMENT = var.environment
    }
  }

  source_code_hash = local.source_code_hash
}

resource "aws_lambda_function" "import_analysis" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-import-analysis"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 60
  memory_size     = 512
  depends_on      = [null_resource.lambda_build]  # Ensure build completes before creating Lambda

  environment {
    variables = {
      MAIN_TABLE = var.main_table_name
      IMPORT_STATUS_TABLE = var.import_status_table_name
      TRANSACTION_FILES_BUCKET = var.transaction_files_bucket_name
      ENVIRONMENT = var.environment
    }
  }

  source_code_hash = local.source_code_hash
}

resource "aws_lambda_function" "import_processor" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-import-processor"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  memory_size     = 1024
  depends_on      = [null_resource.lambda_build]  # Ensure build completes before creating Lambda

  environment {
    variables = {
      MAIN_TABLE = var.main_table_name
      IMPORT_STATUS_TABLE = var.import_status_table_name
      TRANSACTION_FILES_BUCKET = var.transaction_files_bucket_name
      ENVIRONMENT = var.environment
    }
  }

  source_code_hash = local.source_code_hash
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset([
    "/aws/lambda/${var.project_name}-account-api",
    "/aws/lambda/${var.project_name}-transaction-api",
    "/aws/lambda/${var.project_name}-import-upload",
    "/aws/lambda/${var.project_name}-import-analysis",
    "/aws/lambda/${var.project_name}-import-processor"
  ])

  name              = each.value
  retention_in_days = 30
}

# Variables
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to Lambda deployment package"
  type        = string
}

variable "main_table_name" {
  description = "DynamoDB main table name"
  type        = string
}

variable "main_table_arn" {
  description = "DynamoDB main table ARN"
  type        = string
}

variable "import_status_table_name" {
  description = "DynamoDB import status table name"
  type        = string
}

variable "import_status_table_arn" {
  description = "DynamoDB import status table ARN"
  type        = string
}

variable "transaction_files_bucket_name" {
  description = "S3 bucket name for transaction files"
  type        = string
}

variable "transaction_files_bucket_arn" {
  description = "S3 bucket ARN for transaction files"
  type        = string
}

# Outputs
output "lambda_role_arn" {
  value = aws_iam_role.lambda_role.arn
}

output "function_names" {
  value = {
    account_api     = aws_lambda_function.account_api.function_name
    transaction_api = aws_lambda_function.transaction_api.function_name
    import_upload   = aws_lambda_function.import_upload.function_name
    import_analysis = aws_lambda_function.import_analysis.function_name
    import_processor = aws_lambda_function.import_processor.function_name
  }
} 