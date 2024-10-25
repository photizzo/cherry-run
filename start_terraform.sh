#!/bin/bash

# Set environment variables
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""
export AWS_SESSION_TOKEN=""
export TF_VAR_aws_access_key_id="$AWS_ACCESS_KEY_ID"
export TF_VAR_aws_secret_access_key="$AWS_SECRET_ACCESS_KEY"
export TF_VAR_aws_session_token="$AWS_SESSION_TOKEN"

# Initialize Terraform
terraform init

# Plan and apply Terraform configuration
terraform plan
terraform apply -auto-approve