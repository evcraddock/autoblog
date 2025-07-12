# Runtime Environment Variables for Docker Deployment

## Overview

This document explains how the autoblog-web application handles environment variables at runtime when deployed with Docker. This approach follows industry best practices for "build once, deploy anywhere" containerized React applications.

## The Problem

React applications typically replace `process.env` or `import.meta.env` variables at build time, not runtime. This means:
- Environment variables are "baked into" the JavaScript bundle during `npm run build`
- Changing configuration requires rebuilding the entire Docker image
- Sensitive configuration cannot be included in public Docker images

## The Solution: Runtime Configuration Injection

We use a shell script that runs when the Docker container starts to inject environment variables into a JavaScript file that the React app can read.

### How It Works

1. **Build Time**: The Docker image is built without any specific environment variables
2. **Container Startup**: A shell script (`env.sh`) runs and creates a JavaScript file with current environment variables
3. **Runtime**: The React app reads configuration from this dynamically generated file

### Implementation Details

#### 1. The env.sh Script (`autoblog-web/env.sh`)

```bash
#!/bin/sh

# Recreate config file
rm -rf /usr/share/nginx/html/env-config.js
touch /usr/share/nginx/html/env-config.js

# Add assignment 
echo "window._env_ = {" >> /usr/share/nginx/html/env-config.js

# Read environment variables and write them to the config file
echo "  REACT_AUTOBLOG_SYNC_URL: \"${AUTOBLOG_SYNC_URL}\"," >> /usr/share/nginx/html/env-config.js
echo "  REACT_AUTOBLOG_INDEX_ID: \"${AUTOBLOG_INDEX_ID}\"" >> /usr/share/nginx/html/env-config.js

echo "}" >> /usr/share/nginx/html/env-config.js
```

This script:
- Creates a file at `/usr/share/nginx/html/env-config.js`
- Reads environment variables passed to the container
- Writes them as a JavaScript object attached to `window._env_`

#### 2. Dockerfile Configuration

```dockerfile
# Copy env script and make it executable
COPY env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh
```

The `/docker-entrypoint.d/` directory is special in nginx Alpine images - any executable scripts placed here run automatically before nginx starts.

#### 3. HTML Integration (`index.html`)

```html
<script src="/env-config.js"></script>
```

This script tag loads the dynamically generated configuration before the React app starts.

#### 4. Runtime Configuration Helper (`src/config/runtime.ts`)

```typescript
declare global {
  interface Window {
    _env_?: {
      REACT_AUTOBLOG_SYNC_URL?: string;
      REACT_AUTOBLOG_INDEX_ID?: string;
    };
  }
}

export const getRuntimeConfig = () => {
  // In development, use import.meta.env
  if (import.meta.env.DEV) {
    return {
      syncUrl: import.meta.env.VITE_AUTOBLOG_SYNC_URL || 'wss://sync.automerge.org',
      indexId: import.meta.env.VITE_AUTOBLOG_INDEX_ID || '',
    };
  }
  
  // In production, use window._env_ (injected by Docker)
  return {
    syncUrl: window._env_?.REACT_AUTOBLOG_SYNC_URL || 'wss://sync.automerge.org',
    indexId: window._env_?.REACT_AUTOBLOG_INDEX_ID || '',
  };
};
```

This helper:
- Uses Vite environment variables in development
- Uses the window._env_ object in production
- Provides fallback values if variables are not set

#### 5. Application Configuration (`src/config/index.ts`)

```typescript
import { getRuntimeConfig } from './runtime';

const runtimeConfig = getRuntimeConfig();

export const config = {
  syncUrl: runtimeConfig.syncUrl,
  databaseName: import.meta.env.AUTOBLOG_DB_NAME || 'autoblog-web',
  indexId: runtimeConfig.indexId || undefined,
}
```

## Usage

### Docker Compose

```yaml
services:
  autoblog-web:
    image: evcraddock/autoblog-web:latest
    environment:
      - AUTOBLOG_SYNC_URL=wss://sync.automerge.org
      - AUTOBLOG_INDEX_ID=your-index-id
    ports:
      - "8085:80"
```

### Docker Run

```bash
docker run -d \
  -e AUTOBLOG_SYNC_URL=wss://sync.automerge.org \
  -e AUTOBLOG_INDEX_ID=your-index-id \
  -p 8085:80 \
  evcraddock/autoblog-web:latest
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: autoblog-web
spec:
  template:
    spec:
      containers:
      - name: autoblog-web
        image: evcraddock/autoblog-web:latest
        env:
        - name: AUTOBLOG_SYNC_URL
          value: "wss://sync.automerge.org"
        - name: AUTOBLOG_INDEX_ID
          valueFrom:
            secretKeyRef:
              name: autoblog-secrets
              key: index-id
```

## Benefits

1. **Security**: No sensitive configuration is built into the public Docker image
2. **Flexibility**: Same image can be deployed to multiple environments with different configurations
3. **Simplicity**: No need to rebuild images for configuration changes
4. **Standards Compliance**: Follows the Twelve-Factor App methodology for configuration

## Debugging

To verify the configuration is being injected correctly:

1. Check the generated config file inside the container:
   ```bash
   docker exec -it autoblog-web cat /usr/share/nginx/html/env-config.js
   ```

2. Check environment variables are passed to the container:
   ```bash
   docker exec -it autoblog-web env | grep AUTOBLOG_
   ```

3. In the browser console, check the configuration:
   ```javascript
   console.log(window._env_)
   ```

## Adding New Environment Variables

To add a new environment variable:

1. Update `env.sh` to include the new variable
2. Update the TypeScript interface in `runtime.ts`
3. Add the variable to `getRuntimeConfig()` return object
4. Use it in your application via the config object

## References

- [Implementing Runtime Environment Variables in React Apps with Docker](https://www.freecodecamp.org/news/how-to-implement-runtime-environment-variables-with-create-react-app-docker-and-nginx-7f9d42a91d70/)
- [The Twelve-Factor App - Config](https://12factor.net/config)
- [Docker ENTRYPOINT vs CMD](https://docs.docker.com/engine/reference/builder/#entrypoint)