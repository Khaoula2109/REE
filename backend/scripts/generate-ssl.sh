#!/bin/bash

# Script to generate self-signed SSL certificates for development

echo "Generating self-signed SSL certificates for REE..."

mkdir -p ../ssl

openssl req -x509 -newkey rsa:4096 -keyout ../ssl/key.pem -out ../ssl/cert.pem -days 365 -nodes \
  -subj "/C=MA/ST=Rabat/L=Rabat/O=REE/OU=IT Department/CN=localhost"

if [ $? -eq 0 ]; then
    echo "✓ SSL certificates generated successfully!"
    echo "  Key:  ./ssl/key.pem"
    echo "  Cert: ./ssl/cert.pem"
    echo ""
    echo "Note: These are self-signed certificates for development only."
    echo "Your browser will show a security warning - this is expected."
else
    echo "✗ Failed to generate SSL certificates"
    exit 1
fi
