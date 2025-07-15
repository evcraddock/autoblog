#!/bin/sh

# Set target directory (defaults to nginx html dir for Docker)
TARGET_DIR=${TARGET_DIR:-/usr/share/nginx/html}
CONFIG_FILE="$TARGET_DIR/env-config.js"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Recreate config file
rm -f "$CONFIG_FILE"
touch "$CONFIG_FILE"

# Add assignment 
echo "window._env_ = {" >> "$CONFIG_FILE"

# Read each line in .env file or use environment variables
# Each line represents key=value pairs
echo "  AUTOBLOG_SYNC_URL: \"${AUTOBLOG_SYNC_URL:-ws://localhost:3030}\"," >> "$CONFIG_FILE"
echo "  AUTOBLOG_INDEX_ID: \"${AUTOBLOG_INDEX_ID:-}\"" >> "$CONFIG_FILE"

echo "}" >> "$CONFIG_FILE"

echo "Generated config file at: $CONFIG_FILE"
cat "$CONFIG_FILE"