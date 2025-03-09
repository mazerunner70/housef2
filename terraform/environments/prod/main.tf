# Include shared configurations
include {
  path = "../../shared/provider.tf"
}

locals {
  environment = "prod"
  domain_name = "app.housef2.com"
}

# Storage Module
module "storage" {
  source = "../../modules/storage"

  project_name = var.project_name
}

# Authentication Module
module "auth" {
  source = "../../modules/auth"

  project_name = var.project_name
}

# Lambda Module
module "lambda" {
  source = "../../modules/lambda"

  project_name = var.project_name
  environment = local.environment
  lambda_zip_path = "../../../backend/dist/lambda.zip"

  main_table_name = module.storage.main_table_name
  main_table_arn = module.storage.main_table_arn
  import_status_table_name = module.storage.import_status_table_name
  import_status_table_arn = module.storage.import_status_table_arn
  transaction_files_bucket_name = module.storage.transaction_files_bucket
  transaction_files_bucket_arn = "arn:aws:s3:::${module.storage.transaction_files_bucket}"
}

# API Module
module "api" {
  source = "../../modules/api"

  project_name = var.project_name
  environment = local.environment
  cognito_user_pool_arn = module.auth.user_pool_id

  account_api_invoke_arn = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${module.lambda.function_names.account_api}/invocations"
  transaction_api_invoke_arn = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${module.lambda.function_names.transaction_api}/invocations"
  import_upload_invoke_arn = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${module.lambda.function_names.import_upload}/invocations"
}

# CDN Module
module "cdn" {
  source = "../../modules/cdn"

  domain_name = local.domain_name
  web_bucket = module.storage.web_bucket
  api_endpoint = module.api.api_url
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

# Variables
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "housef2"
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-west-1"
}

# Outputs
output "api_url" {
  value = module.api.api_url
}

output "web_url" {
  value = "https://${local.domain_name}"
}

output "api_domain" {
  value = "https://api.${local.domain_name}"
}

output "cognito_user_pool_id" {
  value = module.auth.user_pool_id
}

output "cognito_client_id" {
  value = module.auth.user_pool_client_id
} 