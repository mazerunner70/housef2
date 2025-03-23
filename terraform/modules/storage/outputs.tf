# DynamoDB outputs
output "main_table" {
  value = aws_dynamodb_table.main.name
}

output "import_status_table" {
  value = aws_dynamodb_table.imports.name
}

output "import_status_table_arn" {
  value = aws_dynamodb_table.imports.arn
}

# S3 outputs
output "transaction_files_bucket" {
  value = aws_s3_bucket.imports.id
}

output "transaction_files_bucket_arn" {
  value = aws_s3_bucket.imports.arn
}

output "web_bucket" {
  value = aws_s3_bucket.web.id
}

output "web_bucket_website_endpoint" {
  value = aws_s3_bucket_website_configuration.web.website_endpoint
}
