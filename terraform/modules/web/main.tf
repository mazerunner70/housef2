terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Build process for web files
resource "null_resource" "web_build" {
  triggers = {
    source_code = sha256(join("", [for f in fileset("/home/runner/work/housef2/housef2/frontend/src", "**/*"): filesha256("/home/runner/work/housef2/housef2/frontend/src/${f}")]))
  }

  provisioner "local-exec" {
    command = <<EOT
      echo "Starting frontend build process..." && \
      cd /home/runner/work/housef2/housef2/frontend && \
      echo "Installing dependencies..." && \
      npm install && \
      echo "Building application..." && \
      npm run build || (echo "Build failed!" && exit 1) && \
      echo "Build completed. Contents of dist directory:" && \
      ls -la dist/ || (echo "No dist directory found!" && exit 1) && \
      echo "Uploading files to S3..." && \
      aws s3 sync dist/ s3://${var.web_bucket} \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" --exclude "*.txt" && \
      aws s3 sync dist/ s3://${var.web_bucket} \
        --cache-control "no-cache" \
        --include "*.html" --include "*.txt" && \
      echo "Upload completed"
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
  description = "S3 bucket name for web files"
  type        = string
}

# Outputs
output "website_files" {
  value = "Files uploaded to s3://${var.web_bucket}"
  description = "S3 bucket containing the website files"
} 