# Provider Configuration
terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "housef2-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

# Default provider configuration
provider "aws" {
  region = "eu-west-2"
  default_tags {
    tags = {
      Environment = local.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}

# US East 1 provider for CloudFront/ACM
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = {
      Environment = local.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}

locals {
  environment = "dev"
  domain_name = "dev.${var.domain_name}"
}

# Storage Module
module "storage" {
  source = "../../modules/storage"

  project_name = "${var.project_name}-dev"
  environment = local.environment
}

# Authentication Module
module "auth" {
  source = "../../modules/auth"

  project_name = "${var.project_name}-dev"
}

# Lambda Module
module "lambda" {
  source = "../../modules/lambda"

  project_name = "${var.project_name}-dev"
  environment = local.environment
  lambda_zip_path = "../../../backend/lambda.zip"

  main_table_name = module.storage.main_table
  main_table_arn = "arn:aws:dynamodb:eu-west-2:${data.aws_caller_identity.current.account_id}:table/${module.storage.main_table}"
  import_status_table_name = module.storage.import_status_table
  import_status_table_arn = "arn:aws:dynamodb:eu-west-2:${data.aws_caller_identity.current.account_id}:table/${module.storage.import_status_table}"
  transaction_files_bucket_name = module.storage.transaction_files_bucket
  transaction_files_bucket_arn = "arn:aws:s3:::${module.storage.transaction_files_bucket}"
}

# API Module
module "api" {
  source = "../../modules/api"

  project_name = "${var.project_name}-dev"
  environment = local.environment
  cognito_user_pool_arn = module.auth.user_pool_arn

  account_api_invoke_arn = module.lambda.account_api_invoke_arn
  transaction_api_invoke_arn = module.lambda.transaction_api_invoke_arn
  import_upload_invoke_arn = module.lambda.import_upload_invoke_arn
  import_reassign_invoke_arn = module.lambda.import_reassign_invoke_arn
  import_delete_invoke_arn = module.lambda.import_delete_invoke_arn
  api_domain_name = local.domain_name
}

# CDN Module
module "cdn" {
  source = "../../modules/cdn"
  providers = {
    aws = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name = local.domain_name
  web_bucket = module.storage.web_bucket
  api_endpoint = module.api.api_url
  aws_region = "eu-west-2"
  s3_website_endpoint = module.storage.web_bucket_website_endpoint
  environment = local.environment
}

# Web Module
module "web" {
  source = "../../modules/web"

  project_name = "${var.project_name}-dev"
  environment = local.environment
  web_bucket = module.storage.web_bucket
  aws_region = var.aws_region
  cognito_user_pool_id = module.auth.user_pool_id
  cognito_client_id = module.auth.user_pool_client_id
  api_url = module.api.api_url
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = module.lambda.function_names

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = each.value
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api.execution_arn}/*"
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Variables
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "housef2"
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-west-2"
}

variable "domain_name" {
  description = "Domain name for the CDN"
  type        = string
  default     = "example.com"
}

# Outputs
output "api_url" {
  value = module.api.api_url
}

output "web_url" {
  value = "https://${module.cdn.cloudfront_domain}"
}

output "cognito_user_pool_id" {
  value = module.auth.user_pool_id
}

output "cognito_client_id" {
  value = module.auth.user_pool_client_id
} 