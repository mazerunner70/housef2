#!/bin/bash

# Create main directory structure
mkdir -p modules/{api,auth,storage,lambda,cdn,web}
mkdir -p environments/{dev,prod}
mkdir -p config
mkdir -p scripts

# Create base files for each module
for dir in modules/*; do
  touch "$dir"/{main.tf,variables.tf,outputs.tf}
  touch "$dir/README.md"
done

# API Gateway specific files
touch modules/api/{endpoints.tf,cors.tf,authorizer.tf}

# Lambda specific files
mkdir -p modules/lambda/functions
touch modules/lambda/iam.tf
touch modules/lambda/functions/{account.tf,import.tf,transaction.tf}

# Storage specific files
touch modules/storage/{s3.tf,dynamodb.tf}

# Config files
touch config/{common.tfvars,tags.tf}

# Environment files
for env in environments/*; do
  touch "$env"/{main.tf,variables.tf,outputs.tf,terraform.tfvars,backend.tfvars}
done

# Create helper scripts
touch scripts/{init.sh,plan.sh,apply.sh}
chmod +x scripts/{init.sh,plan.sh,apply.sh}

echo "Directory structure created successfully" 