# Import Lambda functions
resource "aws_lambda_function" "get_imports" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-${var.environment}-get-imports"
  role            = var.lambda_role_arn
  handler         = "import.getImports"  
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      IMPORT_BUCKET_NAME = var.import_bucket_name
      IMPORT_TABLE_NAME  = var.import_table_name
    }
  }

  depends_on = [var.lambda_build]
}

resource "aws_lambda_function" "get_import_analysis" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-${var.environment}-get-import-analysis"
  role            = var.lambda_role_arn
  handler         = "import.getImportAnalysis"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      IMPORT_BUCKET_NAME = var.import_bucket_name
      IMPORT_TABLE_NAME  = var.import_table_name
    }
  }

  depends_on = [var.lambda_build]
}

resource "aws_lambda_function" "get_upload_url" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-${var.environment}-get-upload-url"
  role            = var.lambda_role_arn
  handler         = "import.getUploadUrl"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      IMPORT_BUCKET_NAME = var.import_bucket_name
      IMPORT_TABLE_NAME  = var.import_table_name
    }
  }

  depends_on = [var.lambda_build]
}

resource "aws_lambda_function" "confirm_import" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-${var.environment}-confirm-import"
  role            = var.lambda_role_arn
  handler         = "import.confirmImport"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      IMPORT_BUCKET_NAME = var.import_bucket_name
      IMPORT_TABLE_NAME  = var.import_table_name
    }
  }

  depends_on = [var.lambda_build]
}

resource "aws_lambda_function" "handle_wrong_account" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-${var.environment}-handle-wrong-account"
  role            = var.lambda_role_arn
  handler         = "import.handleWrongAccount"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      IMPORT_BUCKET_NAME = var.import_bucket_name
      IMPORT_TABLE_NAME  = var.import_table_name
    }
  }

  depends_on = [var.lambda_build]
}

resource "aws_lambda_function" "delete_import" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-${var.environment}-delete-import"
  role            = var.lambda_role_arn
  handler         = "import.deleteImport"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
    variables = {
      IMPORT_BUCKET_NAME = var.import_bucket_name
      IMPORT_TABLE_NAME  = var.import_table_name
    }
  }

  depends_on = [var.lambda_build]
}

# Outputs for import functions
output "get_imports_function_name" {
  value = aws_lambda_function.get_imports.function_name
}

output "get_imports_invoke_arn" {
  value = aws_lambda_function.get_imports.invoke_arn
}

output "get_import_analysis_function_name" {
  value = aws_lambda_function.get_import_analysis.function_name
}

output "get_import_analysis_invoke_arn" {
  value = aws_lambda_function.get_import_analysis.invoke_arn
}

output "get_upload_url_function_name" {
  value = aws_lambda_function.get_upload_url.function_name
}

output "get_upload_url_invoke_arn" {
  value = aws_lambda_function.get_upload_url.invoke_arn
}

output "confirm_import_function_name" {
  value = aws_lambda_function.confirm_import.function_name
}

output "confirm_import_invoke_arn" {
  value = aws_lambda_function.confirm_import.invoke_arn
}

output "handle_wrong_account_function_name" {
  value = aws_lambda_function.handle_wrong_account.function_name
}

output "handle_wrong_account_invoke_arn" {
  value = aws_lambda_function.handle_wrong_account.invoke_arn
}

output "delete_import_function_name" {
  value = aws_lambda_function.delete_import.function_name
}

output "delete_import_invoke_arn" {
  value = aws_lambda_function.delete_import.invoke_arn
}
