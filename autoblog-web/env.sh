#!/bin/sh

# Recreate config file
rm -rf /usr/share/nginx/html/env-config.js
touch /usr/share/nginx/html/env-config.js

# Add assignment 
echo "window._env_ = {" >> /usr/share/nginx/html/env-config.js

# Read each line in .env file or use environment variables
# Each line represents key=value pairs
echo "  AUTOBLOG_SYNC_URL: \"${AUTOBLOG_SYNC_URL}\"," >> /usr/share/nginx/html/env-config.js
echo "  AUTOBLOG_INDEX_ID: \"${AUTOBLOG_INDEX_ID}\"" >> /usr/share/nginx/html/env-config.js

echo "}" >> /usr/share/nginx/html/env-config.js