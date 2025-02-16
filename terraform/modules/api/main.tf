resource "aws_api_gateway_rest_api" "main" {
  name = "housef2-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_authorizer" "cognito" {
  name          = "cognito-authorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  provider_arns = [var.cognito_user_pool_arn]
}

# API Resources and Methods would go here
# Example for /accounts endpoint:
resource "aws_api_gateway_resource" "accounts" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "accounts"
}

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
  uri         = var.account_lambda_invoke_arn

  integration_http_method = "POST"
} 