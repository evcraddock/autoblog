#!/bin/sh

# Recreate config file
rm -rf /usr/share/nginx/html/env-config.js
touch /usr/share/nginx/html/env-config.js

# Add assignment 
echo "window._env_ = {" >> /usr/share/nginx/html/env-config.js

# Read each line in .env file or use environment variables
# Each line represents key=value pairs
echo "  REACT_APP_AUTOBLOG_SYNC_URL: \"${APP_AUTOBLOG_SYNC_URL}\"," >> /usr/share/nginx/html/env-config.js
echo "  REACT_APP_AUTOBLOG_INDEX_ID: \"${APP_AUTOBLOG_INDEX_ID}\"" >> /usr/share/nginx/html/env-config.js

echo "}" >> /usr/share/nginx/html/env-config.js