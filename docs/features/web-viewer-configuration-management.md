# Web Viewer Configuration Management

## Overview

This document outlines the configuration management system for autoblog-web, a deployed web application that requires deployment-appropriate configuration suitable for various hosting environments.

## Current Configuration Analysis

### Runtime Configuration Values

The web application currently uses hardcoded values that need to be configurable:

#### Network Configuration
- **WebSocket Sync URL**: `wss://sync.automerge.org`
- **Purpose**: Automerge CRDT synchronization server
- **Current**: Hardcoded in `autoblog-web/src/services/automerge.ts:9`

#### Storage Configuration
- **IndexedDB Database Name**: `autoblog-web`
- **Purpose**: Browser storage for Automerge documents
- **Current**: Hardcoded in `autoblog-web/src/services/automerge.ts:34`

- **Local Storage Keys**:
  - `autoblog-index-id`: Blog index document ID
  - `theme`: User's theme preference ('dark' or 'light')
- **Purpose**: Browser localStorage for metadata
- **Current**: Hardcoded in multiple files

#### Compatibility Configuration
- **CLI Index ID**: `5yuf2779r3W6ntgFZgzR6S6RKiW`
- **Purpose**: Hardcoded fallback to sync with CLI-created index
- **Current**: Hardcoded in `autoblog-web/src/services/automerge.ts:12`

#### Synchronization Configuration
- **Default Sync Source**: `remote` (WebSocket only)
- **Purpose**: Determines sync behavior for web app
- **Current**: Default parameter in function signatures

## Proposed Configuration System

As a deployed web application, autoblog-web should use deployment-appropriate configuration methods that work well with modern web hosting platforms and container orchestration systems.

### Configuration Methods

1. **Build-time configuration** (environment variables during build)
2. **Runtime configuration** (environment variables in production)
3. **Config file injection** (for containerized deployments)

### Configuration Loading Priority

1. **Default values** (hardcoded fallbacks)
2. **Build-time environment variables** (`VITE_*`)
3. **Runtime configuration file** (`/app/config.json`)
4. **Runtime environment variables**

### Configuration Schema

```json
{
  "network": {
    "syncUrl": "wss://sync.automerge.org",
    "timeout": 30000
  },
  "storage": {
    "databaseName": "autoblog-web",
    "indexIdKey": "autoblog-index-id",
    "themeKey": "theme"
  },
  "sync": {
    "defaultSource": "remote"
  },
  "compatibility": {
    "cliIndexId": "5yuf2779r3W6ntgFZgzR6S6RKiW"
  }
}
```

### Environment Variables

#### Build-time (Vite)
```bash
VITE_AUTOBLOG_SYNC_URL=wss://sync.automerge.org
VITE_AUTOBLOG_DB_NAME=autoblog-web
VITE_AUTOBLOG_CLI_INDEX_ID=5yuf2779r3W6ntgFZgzR6S6RKiW
VITE_AUTOBLOG_TIMEOUT=30000
```

#### Runtime (for server-side config injection)
```bash
AUTOBLOG_SYNC_URL=wss://sync.automerge.org
AUTOBLOG_DB_NAME=autoblog-web
AUTOBLOG_CLI_INDEX_ID=5yuf2779r3W6ntgFZgzR6S6RKiW
AUTOBLOG_TIMEOUT=30000
```

### Deployment Examples

#### Docker Compose
```yaml
services:
  autoblog-web:
    image: autoblog-web:latest
    environment:
      - AUTOBLOG_SYNC_URL=wss://sync.automerge.org
      - AUTOBLOG_DB_NAME=autoblog-web
    volumes:
      - ./config.json:/app/config.json:ro
    ports:
      - "3000:3000"
```

#### Kubernetes ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: autoblog-web-config
data:
  config.json: |
    {
      "network": {
        "syncUrl": "wss://sync.automerge.org",
        "timeout": 30000
      },
      "storage": {
        "databaseName": "autoblog-web"
      }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: autoblog-web
spec:
  template:
    spec:
      containers:
      - name: autoblog-web
        image: autoblog-web:latest
        volumeMounts:
        - name: config
          mountPath: /app/config.json
          subPath: config.json
      volumes:
      - name: config
        configMap:
          name: autoblog-web-config
```

#### Netlify/Vercel Environment Variables
```bash
# Build settings
VITE_AUTOBLOG_SYNC_URL=wss://sync.automerge.org
VITE_AUTOBLOG_DB_NAME=autoblog-web

# For runtime config injection (if supported)
AUTOBLOG_SYNC_URL=wss://sync.automerge.org
```

#### Traditional Web Server
```nginx
# nginx.conf
server {
    location /config.json {
        alias /var/www/autoblog/config.json;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    location / {
        root /var/www/autoblog;
        try_files $uri $uri/ /index.html;
    }
}
```

## Implementation Strategy

### Phase 1: Build-time Configuration
1. Implement Vite environment variable support (`VITE_*`)
2. Add configuration validation during build
3. Create TypeScript interfaces for configuration
4. Add configuration loading utilities

### Phase 2: Runtime Configuration
1. Implement runtime configuration file loading (`/app/config.json`)
2. Add configuration merging logic (defaults → build-time → runtime)
3. Create configuration validation and error handling
4. Add configuration hot-reloading (if needed)

### Phase 3: Deployment Integration
1. Create Docker/Kubernetes deployment examples
2. Add configuration documentation for various hosting platforms
3. Implement configuration testing utilities
4. Create deployment-specific configuration templates

### TypeScript Configuration Interface

```typescript
interface WebViewerConfig {
  network: {
    syncUrl: string
    timeout: number
  }
  storage: {
    databaseName: string
    indexIdKey: string
    themeKey: string
  }
  sync: {
    defaultSource: 'local' | 'remote' | 'all'
  }
  compatibility: {
    cliIndexId: string
  }
}

interface ConfigLoader {
  loadConfig(): Promise<WebViewerConfig>
  isConfigValid(config: any): boolean
  getConfigSource(): 'default' | 'build-time' | 'runtime'
}
```

## Platform-Specific Considerations

### Static Site Hosting (Netlify, Vercel, GitHub Pages)
- Use build-time environment variables only
- Configuration baked into build artifacts
- No runtime configuration changes possible

### Container Orchestration (Docker, Kubernetes)
- Support both environment variables and config file injection
- Enable runtime configuration updates
- Health checks should validate configuration

### Traditional Web Servers (Apache, nginx)
- Support config file serving at `/config.json`
- Enable configuration updates without rebuild
- Proper caching headers for configuration

### CDN Deployment
- Configuration must be part of build process
- No runtime configuration changes
- Consider multiple build variants for different environments

## Benefits

1. **Deployment-Appropriate**: Follows web application deployment best practices
2. **Flexible**: Multiple configuration methods for different hosting environments
3. **Scalable**: Works with container orchestration and cloud platforms
4. **Secure**: Supports proper secret management in production environments
5. **Developer-Friendly**: Clear configuration patterns for different deployment scenarios

## Migration Strategy

1. **Maintain backwards compatibility** with current hardcoded values as defaults
2. **Implement build-time configuration** as first enhancement
3. **Add runtime configuration support** for containerized deployments
4. **Create deployment examples** for common hosting platforms
5. **Update documentation** with configuration options for each deployment method

## Security Considerations

- Sensitive configuration should use secure environment variable management
- Configuration validation should prevent injection attacks
- CORS settings should be configurable for different deployment environments
- Configuration endpoints should not expose sensitive information
- Build-time vs runtime configuration should be clearly separated

This configuration system will provide a solid foundation for autoblog-web while following established patterns for modern web application deployments.