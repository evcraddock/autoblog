#!/bin/bash

# Set tmux session name
SESSION_NAME="autoblog-web"

echo "Stopping autoblog-web development server..."

# Check if session exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    # Kill the session
    tmux kill-session -t "$SESSION_NAME"
    echo "✓ Stopped tmux session: $SESSION_NAME"
else
    echo "No active session found: $SESSION_NAME"
fi

# Optional: Kill any orphaned processes on port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Found process still listening on port 3000, killing it..."
    lsof -Pi :3000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    echo "✓ Killed process on port 3000"
fi

echo "Development website stopped."