output "account_api_invoke_arn" {
  value = aws_lambda_function.account_api.invoke_arn
}

output "transaction_api_invoke_arn" {
  value = aws_lambda_function.transaction_api.invoke_arn
}

output "import_upload_invoke_arn" {
  value = module.import_functions.get_upload_url_invoke_arn
}

output "import_analysis_invoke_arn" {
  value = module.import_functions.get_import_analysis_invoke_arn
}

output "import_processor_invoke_arn" {
  value = module.import_functions.confirm_import_invoke_arn
}

output "import_reassign_invoke_arn" {
  value = module.import_functions.handle_wrong_account_invoke_arn
}

output "import_delete_invoke_arn" {
  value = module.import_functions.delete_import_invoke_arn
}

output "get_imports_invoke_arn" {
  value = module.import_functions.get_imports_invoke_arn
}

output "list_paginated_imports_invoke_arn" {
  value = module.import_functions.get_imports_invoke_arn
}

output "function_names" {
  value = {
    account_api     = aws_lambda_function.account_api.function_name
    transaction_api = aws_lambda_function.transaction_api.function_name
    import_upload   = module.import_functions.get_upload_url_function_name
    import_analysis = module.import_functions.get_import_analysis_function_name
    import_processor = module.import_functions.confirm_import_function_name
    import_reassign = module.import_functions.handle_wrong_account_function_name
    import_delete = module.import_functions.delete_import_function_name
    get_imports = module.import_functions.get_imports_function_name
    list_paginated_imports = module.import_functions.get_imports_function_name
  }
}