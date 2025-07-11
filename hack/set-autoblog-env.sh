#!/bin/bash

# Get autoblog configuration
echo "Getting autoblog configuration..."
CONFIG_OUTPUT=$(autoblog config list)

# Extract sync URL, data path, and index ID file name from JSON output
SYNC_URL=$(echo "$CONFIG_OUTPUT" | grep '"syncUrl"' | cut -d'"' -f4)
DATA_PATH=$(echo "$CONFIG_OUTPUT" | grep '"dataPath"' | cut -d'"' -f4)
INDEX_ID_FILE_NAME=$(echo "$CONFIG_OUTPUT" | grep '"indexIdFile"' | cut -d'"' -f4)

# Construct full path to index ID file
INDEX_ID_FILE="$DATA_PATH/$INDEX_ID_FILE_NAME"

# Display extracted configuration values
echo ""
echo "CLI Configuration values:"
echo "  SYNC_URL: $SYNC_URL"
echo "  DATA_PATH: $DATA_PATH"
echo "  INDEX_ID_FILE: $INDEX_ID_FILE"
echo ""

# Read index ID from file if it exists
if [ -f "$INDEX_ID_FILE" ]; then
    INDEX_ID=$(cat "$INDEX_ID_FILE")
    echo "Using index ID: $INDEX_ID"
else
    echo "Index ID file not found: $INDEX_ID_FILE"
    INDEX_ID=""
fi

# Export environment variables
export APP_AUTOBLOG_SYNC_URL="$SYNC_URL"
export APP_AUTOBLOG_INDEX_ID="$INDEX_ID"

echo ""
echo "Environment variables set:"
echo "  APP_AUTOBLOG_SYNC_URL=$APP_AUTOBLOG_SYNC_URL"
echo "  APP_AUTOBLOG_INDEX_ID=$APP_AUTOBLOG_INDEX_ID"
echo ""
echo "Note: Run this script with 'source' to export variables to your current shell:"
echo "  source ./hack/set-autoblog-env.sh"