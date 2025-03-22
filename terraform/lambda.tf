# Import Lambda functions
resource "aws_lambda_function" "get_imports" {
  filename         = "backend/dist/get-imports.zip"
  function_name    = "housef2-get-imports"
  role            = aws_iam_role.lambda_role.arn
  handler         = "handlers/import.getImports"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256("backend/dist/get-imports.zip")

  environment {
    variables = {
      IMPORT_BUCKET_NAME = aws_s3_bucket.imports.id
      IMPORT_TABLE_NAME  = aws_dynamodb_table.imports.name
    }
  }
}

resource "aws_lambda_function" "get_import_analysis" {
  filename         = "backend/dist/get-import-analysis.zip"
  function_name    = "housef2-get-import-analysis"
  role            = aws_iam_role.lambda_role.arn
  handler         = "handlers/import.getImportAnalysis"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256("backend/dist/get-import-analysis.zip")

  environment {
    variables = {
      IMPORT_BUCKET_NAME = aws_s3_bucket.imports.id
      IMPORT_TABLE_NAME  = aws_dynamodb_table.imports.name
    }
  }
}

resource "aws_lambda_function" "get_upload_url" {
  filename         = "backend/dist/get-upload-url.zip"
  function_name    = "housef2-get-upload-url"
  role            = aws_iam_role.lambda_role.arn
  handler         = "handlers/import.getUploadUrl"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256("backend/dist/get-upload-url.zip")

  environment {
    variables = {
      IMPORT_BUCKET_NAME = aws_s3_bucket.imports.id
      IMPORT_TABLE_NAME  = aws_dynamodb_table.imports.name
    }
  }
}

resource "aws_lambda_function" "confirm_import" {
  filename         = "backend/dist/confirm-import.zip"
  function_name    = "housef2-confirm-import"
  role            = aws_iam_role.lambda_role.arn
  handler         = "handlers/import.confirmImport"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256("backend/dist/confirm-import.zip")

  environment {
    variables = {
      IMPORT_BUCKET_NAME = aws_s3_bucket.imports.id
      IMPORT_TABLE_NAME  = aws_dynamodb_table.imports.name
    }
  }
}

resource "aws_lambda_function" "handle_wrong_account" {
  filename         = "backend/dist/handle-wrong-account.zip"
  function_name    = "housef2-handle-wrong-account"
  role            = aws_iam_role.lambda_role.arn
  handler         = "handlers/import.handleWrongAccount"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256("backend/dist/handle-wrong-account.zip")

  environment {
    variables = {
      IMPORT_BUCKET_NAME = aws_s3_bucket.imports.id
      IMPORT_TABLE_NAME  = aws_dynamodb_table.imports.name
    }
  }
}

resource "aws_lambda_function" "delete_import" {
  filename         = "backend/dist/delete-import.zip"
  function_name    = "housef2-delete-import"
  role            = aws_iam_role.lambda_role.arn
  handler         = "handlers/import.deleteImport"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = filebase64sha256("backend/dist/delete-import.zip")

  environment {
    variables = {
      IMPORT_BUCKET_NAME = aws_s3_bucket.imports.id
      IMPORT_TABLE_NAME  = aws_dynamodb_table.imports.name
    }
  }
} 