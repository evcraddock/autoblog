# Start Development Website

Start the autoblog-web application with proper configuration from CLI settings.

## Command

```bash
#!/bin/bash

# Get autoblog configuration
echo "Getting autoblog configuration..."
CONFIG_OUTPUT=$(autoblog config list)

# Extract sync URL, data path, and index ID file name
SYNC_URL=$(echo "$CONFIG_OUTPUT" | grep "syncUrl:" | cut -d'"' -f2)
DATA_PATH=$(echo "$CONFIG_OUTPUT" | grep "dataPath:" | cut -d'"' -f2)
INDEX_ID_FILE_NAME=$(echo "$CONFIG_OUTPUT" | grep "indexIdFile:" | cut -d'"' -f2)

# Construct full path to index ID file
INDEX_ID_FILE="$DATA_PATH/$INDEX_ID_FILE_NAME"

# Read index ID from file if it exists
if [ -f "$INDEX_ID_FILE" ]; then
    INDEX_ID=$(cat "$INDEX_ID_FILE")
    echo "Using index ID: $INDEX_ID"
else
    echo "Index ID file not found: $INDEX_ID_FILE"
    INDEX_ID=""
fi

# Set environment variables and start the web application in a new tmux session
SESSION_NAME="autoblog-web"

echo "Starting autoblog-web with configuration:"
echo "  APP_AUTOBLOG_SYNC_URL=$SYNC_URL"
echo "  APP_AUTOBLOG_INDEX_ID=$INDEX_ID"

# Kill existing session if it exists
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

# Create new tmux session and run the application
tmux new-session -d -s "$SESSION_NAME" -c autoblog-web \
    "APP_AUTOBLOG_SYNC_URL='$SYNC_URL' APP_AUTOBLOG_INDEX_ID='$INDEX_ID' npm run dev"

echo "Development website started in tmux session: $SESSION_NAME"
echo "Access it at: http://localhost:3000/"
echo "To attach to the session: tmux attach-session -t $SESSION_NAME"
```

## Usage

Run this command from the project root directory:

```bash
bash .claude/commands/start-dev-website.md
```