#!/bin/bash

# Script to start the autoblog system
# 1. Lists posts from CLI
# 2. Sets environment variables
# 3. Starts the web application

echo "=== Starting Autoblog System ==="
echo ""

# Step 1: Run autoblog CLI to list posts
echo "📚 Fetching blog posts from CLI..."
cd autoblog-cli
npm run start -- list
cd ..
echo ""

# Step 2: Set environment variables
echo "🔧 Setting environment variables..."
source ./hack/set-autoblog-env.sh
echo ""

# Step 3: Start the web application
echo "🚀 Starting Autoblog Web Application..."
cd autoblog-web
npm run dev