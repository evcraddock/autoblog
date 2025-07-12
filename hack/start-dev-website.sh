#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source the set-autoblog-env script to get environment variables
source "$SCRIPT_DIR/set-autoblog-env.sh"

# Set tmux session name
SESSION_NAME="autoblog-web"

echo ""
echo "Starting autoblog-web with configuration:"
echo "  AUTOBLOG_SYNC_URL=$AUTOBLOG_SYNC_URL"
echo "  AUTOBLOG_INDEX_ID=$AUTOBLOG_INDEX_ID"

# Kill existing session if it exists
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

# Get project directories (SCRIPT_DIR already set above)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
WEB_DIR="$PROJECT_ROOT/autoblog-web"

# Create new tmux session and run the application
tmux new-session -d -s "$SESSION_NAME" -c "$WEB_DIR" \
    "AUTOBLOG_SYNC_URL='$AUTOBLOG_SYNC_URL' AUTOBLOG_INDEX_ID='$AUTOBLOG_INDEX_ID' npm run dev"

echo "Development website started in tmux session: $SESSION_NAME"
echo "Access it at: http://localhost:3000/"
echo "To attach to the session: tmux attach-session -t $SESSION_NAME"