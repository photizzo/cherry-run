#!/bin/bash

# Set your bucket name
BUCKET_NAME="umpire-run-bucket"

# Sync the questions folder
aws s3 sync questions/ s3://$BUCKET_NAME/questions/

echo "Questions folder synced to S3 bucket: $BUCKET_NAME"