#!/bin/bash

# Get configuration argument (default to "default" if not provided)
CONFIG="${1:-default}"

echo "Setting autoblog environment for configuration: $CONFIG"

if [ "$CONFIG" = "local" ]; then
    # Use local development configuration
    echo "Using local development configuration..."
    SYNC_URL="http://localhost:3030"
else
    # Set default sync URL
    SYNC_URL="wss://sync.automerge.org"
fi    

# Set default data path using cross-platform method
case "$(uname)" in
  Darwin)
    DATA_PATH="$HOME/Library/Application Support/autoblog"
    ;;
  Linux)
    DATA_PATH="${XDG_DATA_HOME:-$HOME/.local/share}/autoblog"
    ;;
  *)
    DATA_PATH="${XDG_DATA_HOME:-$HOME/.local/share}/autoblog"
    ;;
esac

# Construct full path to index ID file (using hardcoded filename)
INDEX_ID_FILE="$DATA_PATH/index-id.txt"

# Display configuration values
echo ""
echo "Default configuration values:"
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
export AUTOBLOG_SYNC_URL="$SYNC_URL"
export AUTOBLOG_INDEX_ID="$INDEX_ID"

echo ""
echo "Environment variables set:"
echo "  AUTOBLOG_SYNC_URL=$AUTOBLOG_SYNC_URL"
echo "  AUTOBLOG_INDEX_ID=$AUTOBLOG_INDEX_ID"
echo ""
echo "Note: Run this script with 'source' to export variables to your current shell:"
echo "  source ./hack/set-autoblog-env.sh [local|default]"