# Infrastructure Organization

This document outlines the organization of our Terraform infrastructure code.

## Directory Structure

```
terraform/
├── README.md                    # Project documentation, setup instructions
├── backend.tf                   # S3 backend configuration
├── versions.tf                  # Provider and version constraints
│
├── environments/                # Environment-specific configurations
│   ├── dev/
│   │   ├── main.tf             # Dev environment module calls
│   │   ├── variables.tf        # Dev-specific variables
│   │   ├── outputs.tf          # Dev-specific outputs
│   │   ├── terraform.tfvars    # Dev environment values
│   │   └── backend.tfvars      # Dev backend configuration
│   │
│   └── prod/
│       ├── main.tf             # Prod environment module calls
│       ├── variables.tf        # Prod-specific variables
│       ├── outputs.tf          # Prod-specific outputs
│       ├── terraform.tfvars    # Prod environment values
│       └── backend.tfvars      # Prod backend configuration
│
├── modules/                     # Reusable modules
│   ├── api/                    # API Gateway module
│   │   ├── README.md          # Module documentation
│   │   ├── main.tf            # Main API Gateway resources
│   │   ├── variables.tf       # Input variables
│   │   ├── outputs.tf         # Output values
│   │   ├── endpoints.tf       # API endpoint definitions
│   │   ├── cors.tf           # CORS configuration
│   │   └── authorizer.tf     # Cognito authorizer config
│   │
│   ├── auth/                  # Cognito authentication module
│   │   ├── README.md
│   │   ├── main.tf           # User pool and client config
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── storage/              # S3 and DynamoDB module
│   │   ├── README.md
│   │   ├── main.tf          # Bucket and table definitions
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── s3.tf           # S3-specific resources
│   │   └── dynamodb.tf     # DynamoDB-specific resources
│   │
│   ├── lambda/              # Lambda functions module
│   │   ├── README.md
│   │   ├── main.tf         # Lambda function definitions
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── iam.tf         # IAM roles and policies
│   │   └── functions/     # Individual function configurations
│   │       ├── account.tf
│   │       ├── import.tf
│   │       └── transaction.tf
│   │
│   ├── cdn/               # CloudFront distribution module
│   │   ├── README.md
│   │   ├── main.tf       # CDN configuration
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── web/              # Frontend hosting module
│       ├── README.md
│       ├── main.tf       # S3 website configuration
│       ├── variables.tf
│       └── outputs.tf
│
├── config/              # Shared configuration
│   ├── common.tfvars   # Common variable values
│   └── tags.tf         # Resource tagging strategy
│
└── scripts/            # Utility scripts
    ├── init.sh        # Environment initialization
    ├── plan.sh        # Plan wrapper with common options
    └── apply.sh       # Apply wrapper with common options

## Module Organization

### API Gateway Module (`modules/api`)
- REST API configuration
- Endpoint definitions
- CORS settings
- Cognito authorizer integration
- Lambda integrations

### Authentication Module (`modules/auth`)
- Cognito User Pool configuration
- App client settings
- Identity Pool setup (if needed)
- User attributes and policies

### Storage Module (`modules/storage`)
- S3 buckets for:
  - Frontend hosting
  - Transaction file storage
- DynamoDB tables for:
  - Main application data
  - Import status tracking

### Lambda Module (`modules/lambda`)
- Function definitions
- IAM roles and policies
- Environment variables
- Function-specific configurations

### CDN Module (`modules/cdn`)
- CloudFront distribution
- SSL certificate management
- Cache behaviors
- Custom domain configuration

### Web Module (`modules/web`)
- S3 website hosting
- Frontend build deployment
- Environment configuration injection

## Environment Management

### Development Environment
- Located in `environments/dev`
- Uses development-specific variables
- Configured for development workloads
- Allows more permissive access for testing

### Production Environment
- Located in `environments/prod`
- Uses production-specific variables
- Configured for production workloads
- Implements strict security controls

## Configuration Management

### Backend Configuration
- S3 bucket for state storage
- DynamoDB table for state locking
- Separate state files per environment

### Common Configuration
- Shared variables across environments
- Standard resource tags
- Naming conventions

### Environment-Specific Configuration
- Override variables per environment
- Environment-specific resource sizing
- Custom domain settings

## Security Considerations

### Access Control
- IAM roles per function
- Least privilege principle
- Resource-based policies

### Data Protection
- Encryption at rest
- Secure API endpoints
- Protected S3 buckets

### Monitoring
- CloudWatch Logs
- API Gateway metrics
- Lambda function monitoring

## Deployment Process

### Prerequisites
1. AWS credentials configured
2. Terraform installed
3. Access to state bucket

### Deployment Steps
1. Initialize environment:
   ```bash
   ./scripts/init.sh <environment>
   ```

2. Plan changes:
   ```bash
   ./scripts/plan.sh <environment>
   ```

3. Apply changes:
   ```bash
   ./scripts/apply.sh <environment>
   ```

## Best Practices

### Code Organization
- One resource per file when practical
- Clear separation of concerns
- Consistent naming conventions

### Variable Management
- Use descriptive variable names
- Document all variables
- Set appropriate defaults

### Module Design
- Keep modules focused
- Document inputs and outputs
- Include usage examples

### State Management
- Use remote state
- Enable state locking
- Separate state per environment 