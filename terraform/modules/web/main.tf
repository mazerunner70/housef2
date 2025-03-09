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
      ls -l /home/runner/work/housef2/housef2 && \
      cd ${abspath(path.root)}/../../../frontend && \
      npm install && \
      npm run build && \
      ls -l /home/runner/work/housef2/housef2/frontend/dist
    EOT
  }
}

# Upload built files to S3
resource "null_resource" "debug_files" {
  provisioner "local-exec" {
    command = <<EOT
      echo "Checking files in dist directory:" && \
      ls -la /home/runner/work/housef2/housef2/frontend && \
      echo "Trying fileset:" && \
      find /home/runner/work/housef2/housef2/frontend -type f
    EOT
  }
  depends_on = [null_resource.web_build]
}

resource "aws_s3_object" "web_files" {
  for_each = fileset("/home/runner/work/housef2/housef2/frontend/dist", "*")

  bucket       = var.web_bucket
  key          = each.value
  source       = "/home/runner/work/housef2/housef2/frontend/dist/${each.value}"
  content_type = lookup(local.mime_types, regex("\\.[^.]+$", each.value), "application/octet-stream")
  etag         = filemd5("/home/runner/work/housef2/housef2/frontend/dist/${each.value}")

  depends_on = [null_resource.web_build, null_resource.debug_files]
}

# MIME type mapping
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
    ".txt"  = "text/plain"
    ".map"  = "application/json"
    ".woff" = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"  = "font/ttf"
    ".eot"  = "application/vnd.ms-fontobject"
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
  value = [for file in aws_s3_object.web_files : file.key]
  description = "List of uploaded web files"
} 