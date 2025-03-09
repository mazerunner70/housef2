# HouseF2 Backend Infrastructure

This directory contains Terraform configurations to deploy the HouseF2 backend infrastructure to AWS.

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- Node.js project built (dist/ directory should exist)

## Infrastructure Components

- DynamoDB table for storing import records
- S3 bucket for storing import files
- Lambda functions for analyzing and processing imports
- IAM roles and policies for Lambda functions

## Configuration

The deployment can be customized using the following variables:

- `aws_region`: AWS region to deploy resources (default: us-east-1)
- `environment`: Environment name (dev/staging/prod) (default: dev)
- `project_name`: Project name for resource naming (default: housef2)

## Deployment Steps

1. Build the Node.js project:
   ```bash
   npm run build
   ```

2. Initialize Terraform:
   ```bash
   terraform init
   ```

3. Review the deployment plan:
   ```bash
   terraform plan
   ```

4. Apply the configuration:
   ```bash
   terraform apply
   ```

## State Management

The Terraform state is configured to be stored in S3. You need to configure the backend block in `main.tf` with your state bucket details:

```hcl
backend "s3" {
  bucket = "your-terraform-state-bucket"
  key    = "housef2/backend/terraform.tfstate"
  region = "us-east-1"
}
```

## Outputs

After deployment, Terraform will output:
- DynamoDB table name
- S3 bucket name
- Lambda function names

## Cleanup

To destroy the infrastructure:
```bash
terraform destroy
```

**Note:** This will delete all resources and data. Make sure to backup any important data before running this command. 