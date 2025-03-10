terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

# Generate .env file for frontend build
resource "local_file" "frontend_env" {
  filename = "${path.module}/../../../frontend/.env"
  content  = <<-EOT
    REACT_APP_AWS_REGION=${var.aws_region}
    REACT_APP_COGNITO_USER_POOL_ID=${var.cognito_user_pool_id}
    REACT_APP_COGNITO_CLIENT_ID=${var.cognito_client_id}
    REACT_APP_API_URL=${var.api_url}
  EOT

  # Ensure proper file permissions
  file_permission = "0644"
}

# Build frontend application
resource "null_resource" "frontend_build" {
  triggers = {
    env_file = local_file.frontend_env.content
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../../../frontend"
    command     = <<-EOT
      npm install
      npm run build
    EOT
  }
}

# Upload built frontend to S3
resource "aws_s3_object" "frontend_files" {
  for_each = fileset("${path.module}/../../../frontend/dist", "**/*")

  bucket       = var.web_bucket
  key         = each.value
  source      = "${path.module}/../../../frontend/dist/${each.value}"
  etag        = filemd5("${path.module}/../../../frontend/dist/${each.value}")
  content_type = lookup(local.mime_types, regex("\\.[^.]+$", each.value), null)

  depends_on = [null_resource.frontend_build]
}

locals {
  mime_types = {
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
  }
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

variable "web_bucket" {
  description = "S3 bucket name for web hosting"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  type        = string
}

variable "api_url" {
  description = "API Gateway URL"
  type        = string
}

# Outputs
output "website_files" {
  value = "Files uploaded to s3://${var.web_bucket}"
  description = "S3 bucket containing the website files"
} 