terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
      configuration_aliases = [ aws.us_east_1 ]
    }
  }
}

# CloudFront origin access identity for S3
resource "aws_cloudfront_origin_access_identity" "web" {
  provider = aws.us_east_1
  comment  = "OAI for ${var.domain_name}"
}

# Consolidated CloudFront Distribution
resource "aws_cloudfront_distribution" "consolidated" {
  provider            = aws.us_east_1
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  aliases             = var.use_custom_domain ? [var.domain_name] : []

  # S3 Origin for frontend
  origin {
    domain_name = "${var.web_bucket}.s3.${var.aws_region}.amazonaws.com"
    origin_id   = "S3-${var.web_bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.web.cloudfront_access_identity_path
    }
  }

  # API Gateway Origin
  origin {
    domain_name = replace(var.api_endpoint, "/^https?://([^/]*).*/", "$1")
    origin_id   = "ApiGateway"
    origin_path = ""

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Custom error response for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  # Default cache behavior for frontend content
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.web_bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Cache behavior for API requests
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ApiGateway"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
  }

  tags = {
    Name        = "${var.domain_name}-distribution"
    Environment = var.environment
  }
}

# S3 bucket policy for CloudFront access
resource "aws_s3_bucket_policy" "web" {
  bucket   = var.web_bucket
  policy   = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowPublicRead"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "arn:aws:s3:::${var.web_bucket}/*"
      }
    ]
  })

  depends_on = [aws_cloudfront_origin_access_identity.web]
}

# Variables
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "web_bucket" {
  description = "S3 bucket name for static website"
  type        = string
}

variable "api_endpoint" {
  description = "API Gateway endpoint URL"
  type        = string
}

variable "aws_region" {
  description = "AWS region where the S3 bucket is located"
  type        = string
  default     = "eu-west-2"
}

variable "s3_website_endpoint" {
  description = "Custom S3 website endpoint (optional)"
  type        = string
  default     = null
}

variable "environment" {
  description = "Environment for the API"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for custom domain"
  type        = string
  default     = ""
}

variable "use_custom_domain" {
  description = "Whether to use a custom domain"
  type        = bool
  default     = false
}

# Outputs
output "cloudfront_domain" {
  value = aws_cloudfront_distribution.consolidated.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.consolidated.id
} 