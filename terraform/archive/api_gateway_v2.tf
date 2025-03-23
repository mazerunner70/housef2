# Import endpoints
resource "aws_apigatewayv2_route" "get_imports" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /imports"
  target    = "integrations/${aws_apigatewayv2_integration.get_imports.id}"
}

resource "aws_apigatewayv2_integration" "get_imports" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  description         = "Get all imports for the current user"
  integration_method  = "POST"
  integration_uri     = aws_lambda_function.get_imports.invoke_arn
}

resource "aws_lambda_permission" "get_imports" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_imports.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_apigatewayv2_route" "get_import_analysis" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /imports/{uploadId}/analysis"
  target    = "integrations/${aws_apigatewayv2_integration.get_import_analysis.id}"
}

resource "aws_apigatewayv2_integration" "get_import_analysis" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  description         = "Get import analysis for a specific import"
  integration_method  = "POST"
  integration_uri     = aws_lambda_function.get_import_analysis.invoke_arn
}

resource "aws_lambda_permission" "get_import_analysis" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_import_analysis.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_apigatewayv2_route" "get_upload_url" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /imports/upload-url"
  target    = "integrations/${aws_apigatewayv2_integration.get_upload_url.id}"
}

resource "aws_apigatewayv2_integration" "get_upload_url" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  description         = "Get pre-signed URL for file upload"
  integration_method  = "POST"
  integration_uri     = aws_lambda_function.get_upload_url.invoke_arn
}

resource "aws_lambda_permission" "get_upload_url" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_upload_url.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_apigatewayv2_route" "confirm_import" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /imports/{uploadId}/confirm"
  target    = "integrations/${aws_apigatewayv2_integration.confirm_import.id}"
}

resource "aws_apigatewayv2_integration" "confirm_import" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  description         = "Confirm import and start processing"
  integration_method  = "POST"
  integration_uri     = aws_lambda_function.confirm_import.invoke_arn
}

resource "aws_lambda_permission" "confirm_import" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.confirm_import.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_apigatewayv2_route" "handle_wrong_account" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /imports/{uploadId}/wrong-account"
  target    = "integrations/${aws_apigatewayv2_integration.handle_wrong_account.id}"
}

resource "aws_apigatewayv2_integration" "handle_wrong_account" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  description         = "Handle wrong account detection"
  integration_method  = "POST"
  integration_uri     = aws_lambda_function.handle_wrong_account.invoke_arn
}

resource "aws_lambda_permission" "handle_wrong_account" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handle_wrong_account.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_apigatewayv2_route" "delete_import" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /imports/{uploadId}"
  target    = "integrations/${aws_apigatewayv2_integration.delete_import.id}"
}

resource "aws_apigatewayv2_integration" "delete_import" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  description         = "Delete an import"
  integration_method  = "POST"
  integration_uri     = aws_lambda_function.delete_import.invoke_arn
}

resource "aws_lambda_permission" "delete_import" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_import.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
} 