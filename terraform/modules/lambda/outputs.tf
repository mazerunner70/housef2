output "account_api_invoke_arn" {
  value = aws_lambda_function.account_api.invoke_arn
}

output "transaction_api_invoke_arn" {
  value = aws_lambda_function.transaction_api.invoke_arn
}

output "import_upload_invoke_arn" {
  value = aws_lambda_function.import_upload.invoke_arn
}

output "import_analysis_invoke_arn" {
  value = aws_lambda_function.import_analysis.invoke_arn
}

output "import_processor_invoke_arn" {
  value = aws_lambda_function.import_processor.invoke_arn
} 