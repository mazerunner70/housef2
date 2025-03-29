variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to Lambda deployment package"
  type        = string
}

variable "import_table_name" {
  description = "DynamoDB import table name"
  type        = string
}

variable "import_bucket_name" {
  description = "S3 import bucket name"
  type        = string
}
