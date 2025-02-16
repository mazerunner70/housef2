locals {
  lambda_functions = {
    account_api = {
      name        = "housef2-account-api"
      handler     = "handlers/account/list.handler"
      memory      = 256
      timeout     = 30
    }
    transaction_api = {
      name        = "housef2-transaction-api"
      handler     = "handlers/transaction/list.handler"
      memory      = 256
      timeout     = 30
    }
    import_upload = {
      name        = "housef2-import-upload"
      handler     = "handlers/import/initiate.handler"
      memory      = 256
      timeout     = 30
    }
    import_analysis = {
      name        = "housef2-import-analysis"
      handler     = "handlers/import/analyze.handler"
      memory      = 512
      timeout     = 60
    }
    import_processor = {
      name        = "housef2-import-processor"
      handler     = "handlers/import/process.handler"
      memory      = 512
      timeout     = 300
    }
  }
}

resource "aws_lambda_function" "functions" {
  for_each = local.lambda_functions

  filename         = var.lambda_zip_path
  function_name    = each.value.name
  role             = aws_iam_role.lambda_role.arn
  handler          = each.value.handler
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  runtime          = "nodejs18.x"
  memory_size      = each.value.memory
  timeout          = each.value.timeout

  environment {
    variables = {
      NODE_ENV             = var.environment
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
      COGNITO_CLIENT_ID    = var.cognito_client_id
    }
  }
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = local.lambda_functions

  name              = "/aws/lambda/${each.value.name}"
  retention_in_days = 30
} 