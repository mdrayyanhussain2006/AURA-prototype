#!/bin/bash

# AURA Desktop Vault AI Services
# Vertex AI Infrastructure Deployment Script
# 
# Note: This script prepares the structural endpoints.
# It does not deploy models or upload data to them.

set -e

# Change to the directory of the script
cd "$(dirname "$0")"

echo "================================================================"
echo " AURA Vertex AI Endpoints - Infrastructure Deployment Script    "
echo "================================================================"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID environment variable is not set."
  echo "Please run with: PROJECT_ID=<your-gcp-project-id> $0"
  exit 1
fi

REGION=${REGION:-"us-central1"}

echo "Initializing Terraform..."
terraform init

echo "Generating deployment plan..."
terraform plan -var="project_id=${PROJECT_ID}" -var="region=${REGION}"

echo ""
read -p "Do you want to proceed with deploying these endpoint templates? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Deployment cancelled. No changes have been made."
    exit 0
fi

echo "Applying Terraform infrastructure changes..."
terraform apply -var="project_id=${PROJECT_ID}" -var="region=${REGION}" -auto-approve

echo "Deployment complete!"
echo "Endpoints 'aura-embedding-endpoint' and 'aura-curation-endpoint' created."
