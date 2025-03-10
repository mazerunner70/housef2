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

# Build and deploy frontend application
resource "null_resource" "frontend_deploy" {
  triggers = {
    env_file = local_file.frontend_env.content
    build_time = timestamp() # Force rebuild on every apply during development
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../../../frontend"
    command     = <<-EOT
      # Install dependencies
      echo "Installing dependencies..."
      npm install --legacy-peer-deps

      # Build the application
      echo "Building application..."
      npm run build

      # Sync with S3 bucket with proper content types
      echo "Deploying to S3..."
      aws s3 sync dist s3://${var.web_bucket} \
        --delete \
        --cache-control "max-age=31536000" \
        --exclude "*.html" \
        --exclude "*.json" \
        --exclude "*.txt" \
        --exclude "*.xml" \
        --include "static/**/*"

      # Upload HTML and config files with no-cache
      aws s3 sync dist s3://${var.web_bucket} \
        --delete \
        --cache-control "no-cache" \
        --exclude "*" \
        --include "*.html" \
        --include "*.json" \
        --include "*.txt" \
        --include "*.xml" \
        --content-type "text/html" \
        --content-type "application/json" \
        --content-type "text/plain" \
        --content-type "application/xml"

      echo "Deployment complete!"
    EOT
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