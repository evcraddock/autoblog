#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Source the set-autoblog-env script to get environment variables
source "$SCRIPT_DIR/set-autoblog-env.sh"

echo ""
echo "Starting autoblog-web Docker container with configuration:"
echo "  AUTOBLOG_SYNC_URL=$AUTOBLOG_SYNC_URL"
echo "  AUTOBLOG_INDEX_ID=$AUTOBLOG_INDEX_ID"
echo ""

# Start docker-compose
cd "$PROJECT_ROOT"
docker compose up -d

echo ""
echo "Autoblog website started in Docker container"
echo "Access it at: http://localhost:8085/"
echo ""
echo "To view logs: docker-compose logs -f autoblog-web"
echo "To stop: docker-compose down"