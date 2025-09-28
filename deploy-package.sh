#!/bin/bash

# Next.js Standalone Deployment Package Script
# This script prepares all files needed for cPanel deployment

echo "🚀 Preparing Next.js standalone deployment package..."

# Create deployment directory
DEPLOY_DIR="cpanel-deployment"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy standalone build files
echo "📦 Copying standalone build files..."
cp -r .next/standalone/* $DEPLOY_DIR/

# Copy the entire .next directory structure (required for standalone mode)
echo "📁 Copying .next directory structure..."
cp -r .next $DEPLOY_DIR/

# Copy deployment files
echo "📄 Copying deployment configuration files..."
cp .htaccess $DEPLOY_DIR/
cp start.sh $DEPLOY_DIR/
cp CPANEL_DEPLOYMENT.md $DEPLOY_DIR/

# Make startup script executable
chmod +x $DEPLOY_DIR/start.sh

# Create a simple package.json for the deployment
cat > $DEPLOY_DIR/package.json << EOF
{
  "name": "ltk-restaurant-web-deployment",
  "version": "1.0.0",
  "description": "LTK Restaurant Web Application - Production Deployment",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "next": "15.3.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create deployment instructions
cat > $DEPLOY_DIR/DEPLOY_INSTRUCTIONS.txt << EOF
LTK Restaurant Web - cPanel Deployment Instructions
====================================================

1. Upload all files in this directory to your cPanel public_html folder

2. Set proper permissions:
   chmod +x start.sh
   chmod 755 server.js

3. Start the application:
   ./start.sh
   
   OR manually:
   node server.js

4. Your application will be available at your domain

5. Make sure your hosting supports Node.js applications

6. Configure your database connection in the environment variables

Files included:
- server.js (main application)
- package.json (dependencies)
- node_modules/ (all required packages)
- _next/static/ (static assets)
- .htaccess (routing configuration)
- start.sh (startup script)
- CPANEL_DEPLOYMENT.md (detailed instructions)

For detailed instructions, see CPANEL_DEPLOYMENT.md
EOF

echo "✅ Deployment package created in: $DEPLOY_DIR"
echo "📋 Upload all files from $DEPLOY_DIR to your cPanel public_html directory"
echo "📖 See DEPLOY_INSTRUCTIONS.txt for quick start guide"
echo "📚 See CPANEL_DEPLOYMENT.md for detailed instructions"

# Show directory structure
echo ""
echo "📁 Package contents:"
ls -la $DEPLOY_DIR/
