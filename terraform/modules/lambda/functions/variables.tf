variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to the Lambda function zip file"
  type        = string
}

variable "lambda_role_arn" {
  description = "ARN of the IAM role for Lambda functions"
  type        = string
}

variable "lambda_build" {
  description = "The lambda_build resource to depend on"
  type        = any
}

variable "import_bucket_name" {
  description = "Name of the S3 bucket for imports"
  type        = string
}

variable "import_table_name" {
  description = "Name of the DynamoDB table for imports"
  type        = string
} 