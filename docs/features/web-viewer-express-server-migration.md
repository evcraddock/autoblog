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

#### Phase 1: Basic Express Migration
1. **Express Server Setup**: Basic server with static file serving
2. **Configuration Endpoint**: Secure `/api/config` endpoint
3. **Docker Migration**: Update deployment to use Express instead of nginx
4. **Environment Testing**: Verify configuration security

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