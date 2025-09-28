#!/bin/bash

# Next.js Standalone Startup Script for cPanel
# This script starts your Next.js application

echo "Starting Next.js Restaurant Application..."

# Set environment variables if needed
export NODE_ENV=production
export PORT=${PORT:-3000}

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "Error: server.js not found. Make sure you're in the correct directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Error: node_modules not found. Make sure you've uploaded the standalone build."
    exit 1
fi

# Start the application
echo "Starting server on port $PORT..."
node server.js

# If the above fails, try with different Node.js versions
if [ $? -ne 0 ]; then
    echo "Trying with different Node.js version..."
    # Try with nodejs if node doesn't work
    nodejs server.js
fi
