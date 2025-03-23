# Terraform Migration Plan

## Overview
This document outlines the step-by-step process for reorganizing our Terraform configuration without affecting existing AWS resources.

## Pre-Migration Steps

1. **Create State Backup**
   ```bash
   cd terraform
   terraform state pull > terraform.tfstate.backup
   ```

2. **Document Current Resource Names**
   ```bash
   terraform state list > current_resources.txt
   ```

## Migration Process

### Phase 1: Create New Directory Structure
```bash
cd terraform
mkdir -p modules/{api,auth,storage,lambda,cdn,web}
mkdir -p environments/{dev,prod}
mkdir -p config
mkdir -p scripts
```

### Phase 2: Module Migration

1. **API Gateway Module**
   - Move from: `api_gateway.tf`
   - To: `modules/api/`
   - Files to create:
     - `main.tf` (core resources)
     - `endpoints.tf` (API endpoints)
     - `cors.tf` (CORS configuration)
     - `variables.tf` (input variables)
     - `outputs.tf` (output values)

2. **Authentication Module**
   - Move from: Current Cognito configuration
   - To: `modules/auth/`
   - Files to create:
     - `main.tf` (Cognito resources)
     - `variables.tf`
     - `outputs.tf`

3. **Storage Module**
   - Move from: `dynamodb.tf` and S3 configurations
   - To: `modules/storage/`
   - Split into:
     - `s3.tf` (bucket configurations)
     - `dynamodb.tf` (table configurations)
     - `variables.tf`
     - `outputs.tf`

4. **Lambda Module**
   - Move from: Current Lambda configurations
   - To: `modules/lambda/`
   - Organize into:
     - `functions/*.tf` (one file per function)
     - `iam.tf` (IAM roles and policies)
     - `variables.tf`
     - `outputs.tf`

### Phase 3: Environment Configuration

1. **Development Environment**
   ```hcl
   # environments/dev/main.tf
   module "api" {
     source = "../../modules/api"
     # Keep existing variable values
   }
   # ... other module calls
   ```

2. **Production Environment**
   - Mirror dev structure with production-specific values

### Phase 4: Shared Configuration

1. **Move Common Variables**
   ```hcl
   # config/common.tfvars
   project_name = "housef2"
   aws_region = "eu-west-2"
   ```

2. **Create Tagging Strategy**
   ```hcl
   # config/tags.tf
   locals {
     common_tags = {
       Environment = var.environment
       Project     = var.project_name
       ManagedBy   = "terraform"
     }
   }
   ```

## Validation Steps

1. **State Verification**
   ```bash
   terraform plan
   ```
   - Ensure no resource changes are planned
   - Verify all resources are still tracked

2. **Module Testing**
   ```bash
   terraform validate
   ```
   - Verify module configurations
   - Check variable references

3. **Resource Validation**
   - Compare `terraform state list` output
   - Verify resource attributes unchanged

## Rollback Plan

If issues are encountered:

1. **State Restore**
   ```bash
   terraform state push terraform.tfstate.backup
   ```

2. **File Restore**
   - Keep original files until migration is verified
   - Revert to original structure if needed

## Post-Migration

1. **Update Documentation**
   - Update README files
   - Document new structure
   - Update deployment guides

2. **Create Helper Scripts**
   ```bash
   # scripts/init.sh
   #!/bin/bash
   env=$1
   terraform -chdir=environments/$env init
   ```

3. **Verify Workflows**
   - Test deployment process
   - Verify CI/CD integration 