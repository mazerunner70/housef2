# Infrastructure Design Decisions

## Overview
This document outlines the AWS infrastructure components required for the House Finances application. Infrastructure is managed using Terraform and deployed via GitHub Actions on merges to main branch.

## AWS Components

### Compute
1. **Lambda Functions**
   ```hcl
   # Core Application Lambdas
   - housef2-account-api        # Account management endpoints
   - housef2-transaction-api    # Transaction management endpoints
   - housef2-import-upload     # Handles file upload requests
   - housef2-import-analysis   # Analyzes imported files
   - housef2-import-processor  # Processes confirmed imports
   ```

2. **API Gateway**
   - REST API for all endpoints
   - Custom domain with SSL certificate
   - Cognito authorizer integration
   - Request/response validation
   - CORS configuration

### Storage
1. **DynamoDB Tables**
   ```hcl
   - housef2-main             # Main application table
   - housef2-import-status    # Import process tracking
   ```

2. **S3 Buckets**
   ```hcl
   - housef2-transaction-files    # Import file storage
     ├── pending/
     ├── processing/
     └── processed/
   
   - housef2-web                  # Static website hosting
     ├── assets/
     └── index.html
   
   - housef2-terraform-state      # Terraform state storage
     └── terraform.tfstate
   ```

### Authentication
1. **Cognito**
   - User Pool
   - Identity Pool
   - App Client configuration
   - Custom domain for auth UI

### Content Delivery
1. **CloudFront**
   - Frontend distribution
   - API Gateway distribution
   - SSL certificate
   - Custom domain configuration

## Infrastructure as Code

### Terraform Structure
```
terraform/
├── environments/
│   ├── prod/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── dev/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
├── modules/
│   ├── api/
│   ├── storage/
│   ├── auth/
│   ├── lambda/
│   └── cdn/
└── shared/
    ├── provider.tf
    └── backend.tf
```

### State Management
```hcl
terraform {
  backend "s3" {
    bucket = "housef2-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "eu-west-1"
    
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

## Deployment Process

### GitHub Actions Workflow
```yaml
name: Infrastructure Deployment

on:
  push:
    branches:
      - main
    paths:
      - 'terraform/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v1
        
      - name: Terraform Init
        run: terraform init
        
      - name: Terraform Plan
        run: terraform plan -out=tfplan
        
      - name: Terraform Apply
        run: terraform apply tfplan
```

## Security Considerations

### IAM Configuration
- Least privilege access
- Service roles for Lambda functions
- Cross-account access where needed
- Resource-based policies

### Network Security
```hcl
# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# Security Group Rules
resource "aws_security_group" "lambda" {
  name = "lambda-sg"
  
  ingress {
    from_port = 443
    to_port   = 443
    protocol  = "tcp"
  }
}
```

### Encryption
- S3 bucket encryption
- DynamoDB encryption
- Lambda environment variables
- Secrets management

## Monitoring & Logging

### CloudWatch Configuration
```hcl
# Log Groups
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/lambda/api"
  retention_in_days = 30
}

# Metrics & Alarms
resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "api-errors"
  comparison_operator = "GreaterThanThreshold"
  threshold           = "5"
  period             = "300"
}
```

### X-Ray Tracing
- Enabled for Lambda functions
- API Gateway integration
- DynamoDB operations tracking

## Cost Management

### Resource Tagging
```hcl
tags = {
  Environment = var.environment
  Project     = "housef2"
  ManagedBy   = "terraform"
}
```

### Cost Optimization
- Lambda provisioned concurrency settings
- DynamoDB auto-scaling
- S3 lifecycle policies
- CloudFront caching strategies

## Disaster Recovery

### Backup Configuration
```hcl
resource "aws_backup_plan" "main" {
  name = "housef2-backup"
  
  rule {
    schedule_expression = "cron(0 12 * * ? *)"
    target_vault_name  = aws_backup_vault.main.name
  }
}
```

### Recovery Procedures
1. DynamoDB Point-in-time Recovery
2. S3 versioning
3. Lambda function versions
4. API Gateway deployments 

### Environment Names
```hcl
environments = {
  production = {
    domain = "app.housef2.com"
    region = "eu-west-1"
  }
  development = {
    domain = "dev.housef2.com"
    region = "eu-west-1"
  }
}
```

### Testing Infrastructure
```hcl
# Test Environment Resources
resource "aws_api_gateway_stage" "test" {
  stage_name = "test"
  // ... configuration
}

resource "aws_lambda_function" "test" {
  // Test versions of Lambda functions
}

# Cypress E2E Testing Resources
resource "aws_s3_bucket" "test_artifacts" {
  bucket = "housef2-test-artifacts"
}
``` 