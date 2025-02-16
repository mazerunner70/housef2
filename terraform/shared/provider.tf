provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "housef2"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
} 