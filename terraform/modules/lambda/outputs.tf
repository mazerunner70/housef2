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

output "import_reassign_invoke_arn" {
  value = aws_lambda_function.import_reassign.invoke_arn
}

output "import_delete_invoke_arn" {
  value = aws_lambda_function.import_delete.invoke_arn
}

output "import_get_invoke_arn" {
  value = aws_lambda_function.get_imports.invoke_arn
}

output "list_unassigned_imports_invoke_arn" {
  value = aws_lambda_function.list_unassigned_imports.invoke_arn
}

output "list_paginated_imports_invoke_arn" {
  value = aws_lambda_function.list_paginated_imports.invoke_arn
}

output "function_names" {
  value = {
    account_api     = aws_lambda_function.account_api.function_name
    transaction_api = aws_lambda_function.transaction_api.function_name
    import_upload   = aws_lambda_function.import_upload.function_name
    import_analysis = aws_lambda_function.import_analysis.function_name
    import_processor = aws_lambda_function.import_processor.function_name
    import_reassign = aws_lambda_function.import_reassign.function_name
    import_delete = aws_lambda_function.import_delete.function_name
    get_imports = aws_lambda_function.get_imports.function_name
    list_unassigned_imports = aws_lambda_function.list_unassigned_imports.function_name
    list_paginated_imports = aws_lambda_function.list_paginated_imports.function_name
  }
} 