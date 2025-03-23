terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# DynamoDB Tables
resource "aws_dynamodb_table" "main" {
  name            = "${var.project_name}-${var.environment}-main"
  billing_mode    = "PAY_PER_REQUEST"
  hash_key        = "PK"
  range_key       = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1-PK"
    type = "S"
  }

  attribute {
    name = "GSI1-SK"
    type = "S"
  }

  attribute {
    name = "GSI2-PK"
    type = "S"
  }

  attribute {
    name = "GSI2-SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1-PK"
    range_key       = "GSI1-SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2-PK"
    range_key       = "GSI2-SK"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_dynamodb_table" "import_status" {
  name            = "${var.project_name}-${var.environment}-import-status"
  billing_mode    = "PAY_PER_REQUEST"
  hash_key        = "PK"
  range_key       = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "AccountId"
    type = "S"
  }

  attribute {
    name = "Status"
    type = "S"
  }

  global_secondary_index {
    name            = "AccountIndex"
    hash_key        = "AccountId"
    range_key       = "Status"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

# S3 Buckets
resource "aws_s3_bucket" "transaction_files" {
  bucket   = "${var.project_name}-${var.environment}-transaction-files"
}

resource "aws_s3_bucket_versioning" "transaction_files" {
  bucket   = aws_s3_bucket.transaction_files.id
  versioning_configuration {
    status = "Enabled"
  }

  depends_on = [aws_s3_bucket.transaction_files]
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_files" {
  bucket   = aws_s3_bucket.transaction_files.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }

  depends_on = [aws_s3_bucket.transaction_files]
}

resource "aws_s3_bucket" "web" {
  bucket   = "${var.project_name}-${var.environment}-web"
}

resource "aws_s3_bucket_versioning" "web" {
  bucket   = aws_s3_bucket.web.id
  versioning_configuration {
    status = "Enabled"
  }

  depends_on = [aws_s3_bucket.web]
}

resource "aws_s3_bucket_server_side_encryption_configuration" "web" {
  bucket   = aws_s3_bucket.web.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }

  depends_on = [aws_s3_bucket.web]
}

resource "aws_s3_bucket_website_configuration" "web" {
  bucket   = aws_s3_bucket.web.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }

  depends_on = [aws_s3_bucket.web]
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket   = aws_s3_bucket.web.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

  depends_on = [aws_s3_bucket.web]
}

resource "aws_s3_bucket_cors_configuration" "web" {
  bucket   = aws_s3_bucket.web.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }

  depends_on = [aws_s3_bucket.web]
}

# Variables
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment for resource naming"
  type        = string
} 