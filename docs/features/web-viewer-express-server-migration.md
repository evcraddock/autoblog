# Web Viewer Express Server Migration

## Overview

Migrate the autoblog web viewer from a pure static SPA deployment to an Express.js server-based architecture to address security concerns with public configuration exposure and enable future extensibility.

## Current Architecture Issues

### Security Vulnerabilities
- Configuration data exposed via publicly accessible `env-config.js`
- Sync server URLs and index IDs visible to all users
- No authentication or authorization layer for sensitive configuration

### Limitations
- No ability to add server-side API endpoints
- Cannot implement request proxying for external services
- Limited extensibility for future backend features

## Requirements

### Core Express Server Implementation

#### 1. Server Setup and Configuration
- **Express.js Application**: Create production-ready Express server
- **Environment Variable Management**: Secure server-side environment variable handling
- **Static File Serving**: Serve built React application from `/dist` directory
- **SPA Routing Support**: Handle client-side routing with proper fallback to `index.html`
- **Health Check Endpoint**: Basic health monitoring endpoint

#### 2. Secure Configuration Management
- **Protected Config Endpoint**: `/api/config` endpoint for runtime configuration
- **Server-side Environment Access**: Keep sensitive config server-side only
- **Configuration Validation**: Validate required environment variables on startup
- **Default Value Handling**: Graceful fallback for missing configuration

```typescript
// Example config endpoint structure
GET /api/config
{
  "syncUrl": "wss://sync.server.url",
  "indexId": "secure-index-id",
  "features": {
    "authentication": boolean,
    "analytics": boolean
  }
}
```

#### 3. Production Deployment Requirements
- **Docker Container**: Update Dockerfile for Express server deployment
- **Port Configuration**: Configurable port with default 3000
- **Graceful Shutdown**: Proper SIGTERM/SIGINT handling
- **Error Handling**: Comprehensive error handling and logging
- **Security Headers**: Security middleware (helmet, CORS, etc.)

### Future Extensibility Architecture

#### 4. API Proxy Infrastructure
- **Proxy Middleware**: Express middleware for proxying external API calls
- **Request/Response Transformation**: Ability to modify proxied requests/responses
- **Authentication Passthrough**: Forward authentication headers to proxied services
- **Rate Limiting**: Built-in rate limiting for proxied endpoints
- **Caching Layer**: Optional response caching for proxied API calls

```typescript
// Example proxy configuration
app.use('/api/proxy/*', proxyMiddleware({
  target: process.env.PROXY_TARGET_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/proxy': '' },
  // Custom auth, rate limiting, caching
}));
```

#### 5. Custom API Endpoint Framework
- **RESTful Route Structure**: Standard REST API patterns
- **Middleware Pipeline**: Authentication, validation, logging middleware
- **Database Integration Ready**: Prepared for future database connections
- **API Versioning**: Support for API version management (`/api/v1/`)
- **OpenAPI Documentation**: Swagger/OpenAPI spec generation capability

```typescript
// Example future API structure
POST   /api/v1/posts           // Create post
GET    /api/v1/posts           // List posts
GET    /api/v1/posts/:id       // Get specific post
PUT    /api/v1/posts/:id       // Update post
DELETE /api/v1/posts/:id       // Delete post
```

#### 6. Authentication and Authorization Framework
- **Authentication Middleware**: Pluggable auth system (JWT, session-based)
- **Role-based Access Control**: RBAC framework for future user management
- **API Key Management**: Support for API key authentication
- **CORS Configuration**: Configurable CORS for different environments

### Implementation Strategy

#### Phase 1: SSR-Enabled Express Migration
1. **Vite SSR Setup**: Implement Vite SSR with Express for both development and production
2. **Configuration Endpoint**: Secure `/api/config` endpoint
3. **Docker Migration**: Update deployment to use Express SSR instead of nginx
4. **Environment Testing**: Verify configuration security and SSR functionality

#### Phase 2: Proxy Infrastructure
1. **Proxy Middleware**: Generic proxy capability
2. **Configuration System**: Proxy route configuration via environment variables
3. **Error Handling**: Comprehensive proxy error handling
4. **Documentation**: Proxy usage documentation

#### Phase 3: API Framework
1. **Route Structure**: Establish API route organization
2. **Middleware Pipeline**: Authentication, validation, logging
3. **Documentation System**: OpenAPI integration
4. **Testing Framework**: API endpoint testing

### Vite SSR Development and Production Setup

#### Development Environment
Using Vite in middleware mode with Express for hot module replacement and fast development:

```typescript
// server-dev.ts
import express from 'express'
import { createServer as createViteServer } from 'vite'

async function createDevServer() {
  const app = express()
  
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  })
  
  // Use vite's connect instance as middleware
  app.use(vite.middlewares)
  
  app.use('*', async (req, res) => {
    const url = req.originalUrl
    
    try {
      // Get the index.html template
      let template = await vite.transformIndexHtml(url, indexTemplate)
      
      // Render the app HTML using SSR entry
      const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
      const appHtml = await render(url)
      
      // Inject rendered app into template
      const html = template.replace('<!--ssr-outlet-->', appHtml)
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      res.status(500).end(e.message)
    }
  })
  
  return app
}
```

#### Production Build Process
Separate builds for client and server bundles:

```json
{
  "scripts": {
    "dev": "node server-dev.js",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build --outDir dist/client",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.ts",
    "start": "NODE_ENV=production node server-prod.js"
  }
}
```

#### Production Server
Serves pre-built SSR content for optimal performance:

```typescript
// server-prod.ts
import express from 'express'
import fs from 'fs'
import path from 'path'

const app = express()

// Serve static assets with caching
app.use('/assets', express.static('dist/client/assets', {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache')
    }
  }
}))

// Load production assets
const template = fs.readFileSync('dist/client/index.html', 'utf-8')
const { render } = require('./dist/server/entry-server.js')

app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl
    const appHtml = await render(url)
    const html = template.replace('<!--ssr-outlet-->', appHtml)
    
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  } catch (e) {
    res.status(500).end(e.message)
  }
})
```

#### SSR Entry Points

**Client Entry (`src/entry-client.ts`)**:
```typescript
import { createApp } from './main'

const { app } = createApp()

// Hydrate the SSR rendered content
app.mount('#app')
```

**Server Entry (`src/entry-server.ts`)**:
```typescript
import { createApp } from './main'
import { renderToString } from 'vue/server-renderer' // or React equivalent

export async function render(url: string) {
  const { app, router } = createApp()
  
  // Set the router to the desired URL before rendering
  router.push(url)
  await router.isReady()
  
  // Render the app to HTML string
  const html = await renderToString(app)
  
  return html
}
```

#### Universal App Code (`src/main.ts`)**:
```typescript
// Shared app creation logic for both client and server
export function createApp() {
  const app = createVueApp(App) // or React equivalent
  const router = createRouter()
  
  app.use(router)
  
  return { app, router }
}
```

### Docker Deployment with SSR

#### Production Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist ./dist
COPY server-prod.js ./

# Expose port
EXPOSE 3000

# Start the SSR server
CMD ["node", "server-prod.js"]
```

#### Build Process Integration
```bash
# Build script for CI/CD
npm run build:client
npm run build:server

# Copy server files
cp server-prod.js dist/
cp package*.json dist/

# Build Docker image
docker build -t autoblog-ssr .
```

#### Environment Configuration for SSR
```bash
# SSR-specific environment variables
NODE_ENV=production
PORT=3000
SSR_ENABLED=true

# Existing autoblog configuration
AUTOBLOG_SYNC_URL=wss://sync.server.url
AUTOBLOG_INDEX_ID=secure-index-id

# Performance optimization
SSR_CACHE_TTL=300
PRELOAD_CHUNKS=true
```

### SSR Benefits for Autoblog

1. **Improved SEO**: Search engines can crawl pre-rendered content
2. **Faster Initial Load**: Users see content immediately, then hydration occurs
3. **Better Core Web Vitals**: Improved First Contentful Paint (FCP) metrics
4. **Progressive Enhancement**: Works even if JavaScript fails to load
5. **Secure Configuration**: Server-side rendering ensures config stays server-side

### Development Workflow

1. **Development**: `npm run dev` starts Vite SSR dev server with HMR
2. **Build**: `npm run build` creates optimized client and server bundles
3. **Production**: `npm start` runs production SSR server
4. **Docker**: Build container with pre-rendered SSR setup for deployment

### Configuration Schema

#### Required Environment Variables
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Autoblog Configuration
AUTOBLOG_SYNC_URL=wss://sync.server.url
AUTOBLOG_INDEX_ID=secure-index-id

# Future API Configuration
API_BASE_URL=/api/v1
API_CORS_ORIGIN=https://yourdomain.com

# Future Proxy Configuration
PROXY_TARGET_URL=https://external-api.example.com
PROXY_RATE_LIMIT=100

# Future Authentication
JWT_SECRET=your-secret-key
API_KEY_HEADER=X-API-Key
```

#### Optional Configuration
```bash
# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_PROXY=false
ENABLE_API_V1=false

# Caching
CACHE_TTL=300
ENABLE_RESPONSE_CACHE=false

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Migration Considerations

#### Backward Compatibility
- **Gradual Migration**: Support both nginx and Express deployment methods during transition
- **Configuration Format**: Maintain existing environment variable names where possible
- **Client-side Changes**: Minimal changes to React application required

#### Performance
- **Static Asset Serving**: Efficient static file serving with proper caching headers
- **Compression**: Gzip/Brotli compression for responses
- **Health Monitoring**: Performance metrics and monitoring endpoints

#### Security
- **Security Headers**: Comprehensive security header middleware
- **Input Validation**: Request validation and sanitization
- **Rate Limiting**: Configurable rate limiting per endpoint
- **Audit Logging**: Security event logging

### Testing Requirements

#### Unit Tests
- Configuration endpoint functionality
- Proxy middleware behavior
- Authentication middleware
- Error handling scenarios

#### Integration Tests
- Full server startup and configuration
- Static file serving
- API endpoint responses
- Proxy functionality

#### Security Tests
- Configuration data exposure verification
- Authentication bypass attempts
- Rate limiting effectiveness
- Input validation coverage

### Documentation Updates

#### Developer Documentation
- Local development setup with Express server
- Environment variable configuration guide
- API endpoint documentation (future)
- Proxy configuration examples

#### Deployment Documentation
- Docker deployment updates
- Environment variable management
- Health check configuration
- Monitoring and logging setup

## Success Criteria

1. **Security**: Configuration data no longer publicly accessible
2. **Functionality**: All existing web viewer features work unchanged
3. **Performance**: No significant performance degradation
4. **Extensibility**: Clear path for future API and proxy features
5. **Maintainability**: Clean, well-documented Express server architecture
6. **Deployment**: Smooth Docker-based deployment process

## Timeline

- **Phase 1 (Immediate)**: Basic Express server with secure config (~1-2 days)
- **Phase 2 (Near-term)**: Proxy infrastructure (~3-5 days)
- **Phase 3 (Future)**: Full API framework (~1-2 weeks)

This migration provides a secure foundation while establishing the groundwork for future backend functionality expansion.