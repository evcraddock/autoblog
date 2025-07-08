# Web Viewer Configuration Management

## Overview

The autoblog-web application needs to support configurable values through environment variables for deployment flexibility.

## Configuration Values

The following values need to be configurable:

### Environment Variables

```bash
# WebSocket sync server URL
APP_AUTOBLOG_SYNC_URL=wss://sync.automerge.org

# Browser database name
APP_AUTOBLOG_DB_NAME=autoblog-web

# CLI compatibility index ID
APP_AUTOBLOG_CLI_INDEX_ID=5yuf2779r3W6ntgFZgzR6S6RKiW
```

## Implementation

### Configuration Service

Create a simple configuration service that reads from environment variables:

```typescript
// src/config/index.ts
export const config = {
  syncUrl: import.meta.env.APP_AUTOBLOG_SYNC_URL || 'wss://sync.automerge.org',
  databaseName: import.meta.env.APP_AUTOBLOG_DB_NAME || 'autoblog-web',
  cliIndexId: import.meta.env.APP_AUTOBLOG_CLI_INDEX_ID || '5yuf2779r3W6ntgFZgzR6S6RKiW'
}
```

### Usage Example

Replace hardcoded values with config references:

```typescript
// Before
const syncUrl = 'wss://sync.automerge.org'

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
      - APP_AUTOBLOG_SYNC_URL=wss://sync.automerge.org
      - APP_AUTOBLOG_DB_NAME=autoblog-web
      - APP_AUTOBLOG_CLI_INDEX_ID=5yuf2779r3W6ntgFZgzR6S6RKiW
    ports:
      - "3000:3000"
```

## Build Configuration

For Vite-based builds, create a `.env` file:

```bash
APP_AUTOBLOG_SYNC_URL=wss://sync.automerge.org
APP_AUTOBLOG_DB_NAME=autoblog-web
APP_AUTOBLOG_CLI_INDEX_ID=5yuf2779r3W6ntgFZgzR6S6RKiW
```

That's it. Simple environment variable configuration for deployment flexibility.