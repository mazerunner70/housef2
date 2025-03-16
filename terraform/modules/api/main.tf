# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name = "${var.project_name}-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Cognito Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "cognito-authorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  provider_arns = [var.cognito_user_pool_arn]
}

# API Resources
resource "aws_api_gateway_resource" "accounts" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "accounts"
}

resource "aws_api_gateway_resource" "account" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.accounts.id
  path_part   = "{accountId}"
}

resource "aws_api_gateway_resource" "transactions" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.account.id
  path_part   = "transactions"
}

resource "aws_api_gateway_resource" "imports" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.account.id
  path_part   = "imports"
}

resource "aws_api_gateway_resource" "import" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.imports.id
  path_part   = "{uploadId}"
}

resource "aws_api_gateway_resource" "reassign" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.import.id
  path_part   = "reassign"
}

# Methods
resource "aws_api_gateway_method" "get_accounts" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.accounts.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "get_accounts" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.accounts.id
  http_method = aws_api_gateway_method.get_accounts.http_method
  type        = "AWS_PROXY"
  uri         = var.account_api_invoke_arn
  integration_http_method = "POST"
}

resource "aws_api_gateway_method" "get_transactions" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.transactions.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.accountId" = true
  }
}

resource "aws_api_gateway_integration" "get_transactions" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.transactions.id
  http_method = aws_api_gateway_method.get_transactions.http_method
  type        = "AWS_PROXY"
  uri         = var.transaction_api_invoke_arn
  integration_http_method = "POST"
}

resource "aws_api_gateway_method" "post_import" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.imports.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.accountId" = true
  }
}

resource "aws_api_gateway_integration" "post_import" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.imports.id
  http_method = aws_api_gateway_method.post_import.http_method
  type        = "AWS_PROXY"
  uri         = var.import_upload_invoke_arn
  integration_http_method = "POST"
}

resource "aws_api_gateway_method" "post_reassign" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.reassign.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.accountId" = true,
    "method.request.path.uploadId" = true
  }
}

resource "aws_api_gateway_integration" "post_reassign" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.reassign.id
  http_method = aws_api_gateway_method.post_reassign.http_method
  type        = "AWS_PROXY"
  uri         = var.import_reassign_invoke_arn
  integration_http_method = "POST"
}

# CORS Configuration
resource "aws_api_gateway_method" "options_accounts" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.accounts.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_accounts" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.accounts.id
  http_method = aws_api_gateway_method.options_accounts.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options_accounts" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.accounts.id
  http_method = aws_api_gateway_method.options_accounts.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_accounts" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.accounts.id
  http_method = aws_api_gateway_method.options_accounts.http_method
  status_code = aws_api_gateway_method_response.options_accounts.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  depends_on = [
    aws_api_gateway_integration.get_accounts,
    aws_api_gateway_integration.get_transactions,
    aws_api_gateway_integration.post_import,
    aws_api_gateway_integration.post_reassign,
    aws_api_gateway_integration.options_accounts
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment
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

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "account_api_invoke_arn" {
  description = "Account API Lambda invoke ARN"
  type        = string
}

variable "transaction_api_invoke_arn" {
  description = "Transaction API Lambda invoke ARN"
  type        = string
}

variable "import_upload_invoke_arn" {
  description = "Import Upload Lambda invoke ARN"
  type        = string
}

variable "import_reassign_invoke_arn" {
  description = "Import Reassign Lambda invoke ARN"
  type        = string
}

# Outputs
output "api_url" {
  value = "${aws_api_gateway_stage.main.invoke_url}"
}

output "rest_api_id" {
  value = aws_api_gateway_rest_api.main.id
}

output "stage_name" {
  value = aws_api_gateway_stage.main.stage_name
}

output "execution_arn" {
  value = aws_api_gateway_rest_api.main.execution_arn
} 