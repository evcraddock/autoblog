#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Stopping autoblog-web Docker container..."

# Stop docker-compose
cd "$PROJECT_ROOT"
docker-compose down

echo "Autoblog Docker container stopped."