# Web Viewer Configuration Management

## Overview

The autoblog-web application operates independently by default and supports configurable values through environment variables for deployment flexibility and optional CLI integration.

## Configuration Values

The following values need to be configurable:

### Environment Variables

```bash
# WebSocket sync server URL
AUTOBLOG_SYNC_URL=wss://sync_server

# Browser database name
AUTOBLOG_DB_NAME=autoblog-web

# Optional: Specific index ID to use (for CLI integration)
AUTOBLOG_INDEX_ID=your-index-id
```

## Implementation

### Configuration Service

Create a simple configuration service that reads from environment variables:

```typescript
// src/config/index.ts
export const config = {
  syncUrl: import.meta.env.AUTOBLOG_SYNC_URL || 'wss://sync_server',
  databaseName: import.meta.env.AUTOBLOG_DB_NAME || 'autoblog-web',
  // Optional: Specific index ID to use (for CLI integration)
  indexId: import.meta.env.AUTOBLOG_INDEX_ID || undefined,
}
```

### Usage Example

Replace hardcoded values with config references:

```typescript
// Before
const syncUrl = 'wss://sync_server'

// After
import { config } from '@/config'
const syncUrl = config.syncUrl
```

## Docker Compose Example

```yaml
services:
  autoblog-web:
    image: autoblog-web:latest
    environment:
      - AUTOBLOG_SYNC_URL=wss://sync_server
      - AUTOBLOG_DB_NAME=autoblog-web
      - AUTOBLOG_INDEX_ID=your-index-id
    ports:
      - "3000:3000"
```

## Build Configuration

For Vite-based builds, create a `.env` file:

```bash
AUTOBLOG_SYNC_URL=wss://sync_server
AUTOBLOG_DB_NAME=autoblog-web
AUTOBLOG_INDEX_ID=your-index-id
```

## Independent Operation

By default, the web viewer operates independently:

1. **No CLI dependency**: Creates its own blog index if none is configured
2. **Own document storage**: Uses browser localStorage to remember its index
3. **Sync server connection**: Connects to the same sync server as other clients

## CLI Integration (Optional)

To integrate with an existing CLI blog, set the index ID:

```bash
# Get the CLI index ID
cd path/to/cli && npx autoblog config get storage.indexIdFile

# Set it in the web viewer
AUTOBLOG_INDEX_ID=your-cli-index-id
```

This allows the web viewer to display posts created by the CLI, but it's completely optional.

That's it. Simple environment variable configuration with independent operation by default.