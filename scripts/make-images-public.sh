#!/bin/bash

# Make all uploaded images publicly readable

echo "Making images publicly accessible..."

# Set ACL for all images
aws s3 cp s3://clementstheory/images/ s3://clementstheory/images/ \
  --recursive \
  --acl public-read \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000"

echo "Done! All images are now publicly accessible."
