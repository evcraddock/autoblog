# Autoblog Web Viewer

[![Web CI](https://github.com/evcraddock/autoblog/actions/workflows/web-ci.yml/badge.svg)](https://github.com/evcraddock/autoblog/actions/workflows/web-ci.yml)
[![Web Quality](https://github.com/evcraddock/autoblog/actions/workflows/web-quality.yml/badge.svg)](https://github.com/evcraddock/autoblog/actions/workflows/web-quality.yml)

A modern, responsive web viewer for Autoblog - a local-first blog platform built on Automerge CRDT with Server-Side Rendering (SSR).

## 🚀 Features

- **Server-Side Rendering**: Fast initial page loads with SEO-friendly pre-rendered content
- **Local-First Architecture**: Works offline with automatic synchronization when connected
- **Real-Time Sync**: Changes propagate instantly across all connected devices
- **Secure Configuration**: Server-side config management prevents exposure of sensitive data
- **Dark Mode Support**: Automatic theme switching with system preference detection
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Fast Performance**: Built with Vite SSR for optimized development and production

## 🛠️ Technology Stack

- **React 19** - Modern UI library with concurrent features
- **TypeScript** - Type-safe development with strict mode
- **Express.js** - SSR server with secure configuration API
- **Vite 7** - Lightning-fast build tool with SSR support
- **Tailwind CSS** - Utility-first CSS with custom design system
- **Automerge 2.0** - CRDT for distributed data synchronization
- **Vitest** - Fast unit testing with React Testing Library

## 📦 Installation

```bash
# From the repository root
cd autoblog-web

# Install dependencies
npm install

# Start SSR development server
npm run dev
```

## 🧪 Development

### Available Scripts

```bash
# Start SSR development server (http://localhost:3000)
npm run dev

# Build for production (client + server bundles)
npm run build

# Build client bundle only
npm run build:client

# Build server bundle only
npm run build:server

# Start production SSR server
npm start

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Type checking
npm run type-check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### SSR Architecture

The application uses Vite's SSR capabilities with Express.js:

**Development Mode:**

- Hot Module Replacement with real-time updates
- Vite middleware integration for seamless development
- Full debugging support with source maps

**Production Mode:**

- Pre-built client and server bundles
- Optimized asset serving with caching
- Secure server-side configuration management

### Project Structure

```
autoblog-web/
├── src/
│   ├── components/       # React components
│   ├── contexts/         # React contexts for state management
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── router/           # Routing configuration
│   ├── services/         # External service integrations
│   ├── styles/           # Global styles and Tailwind config
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── entry-client.tsx  # Client-side entry point for hydration
│   └── entry-server.tsx  # Server-side entry point for SSR
├── server-dev.js         # Development SSR server with Vite middleware
├── server-prod.js        # Production SSR server
├── public/               # Static assets
├── index.html            # HTML template with SSR outlet
└── [config files]        # Various configuration files
```

## 🔧 Configuration

### Environment Variables

The application uses server-side environment variables that are injected at runtime:

```env
# Automerge sync server URL
AUTOBLOG_SYNC_URL=ws://localhost:3030

# Optional: Specific index ID to use
AUTOBLOG_INDEX_ID=
```

### Setting Environment Variables

**Local Development:**

```bash
# Create .env file
cp .env.example .env

# Edit .env with your values
# Then run the dev server
npm run dev
```

**Docker:**

```bash
# Using docker run
docker run -d \
  -p 8085:3000 \
  -e AUTOBLOG_SYNC_URL=ws://your-sync-server:3030 \
  -e AUTOBLOG_INDEX_ID=your-index-id \
  evcraddock/autoblog-web:latest

# Using docker-compose
# Set in .env file or shell environment
export AUTOBLOG_SYNC_URL=ws://your-sync-server:3030
export AUTOBLOG_INDEX_ID=your-index-id
docker-compose up
```

**Systemd Service:**

```ini
# /etc/systemd/system/autoblog-web.service
[Service]
Environment="AUTOBLOG_SYNC_URL=ws://your-sync-server:3030"
Environment="AUTOBLOG_INDEX_ID=your-index-id"
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/node /opt/autoblog-web/server.js
```

### Runtime Configuration

Configuration is injected into the HTML at runtime by the Express server:

- No build-time configuration needed
- Same Docker image works in all environments
- Environment variables read when container/process starts
- Configuration available to client via injected script

```json
{
  "syncUrl": "ws://sync-server:3030",
  "indexId": "main",
  "features": {
    "authentication": false,
    "analytics": false
  }
}
```

## 🚀 Build & Deployment

### Local Development

```bash
# Start SSR development server
npm run dev
```

### Production Build

```bash
# Build both client and server bundles
npm run build

# Verify build output
ls -la dist/client/  # Browser assets
ls -la dist/server/  # Node.js server code

# Test production server locally
npm start
```

### Docker Deployment

**Build Docker Image:**

```bash
docker build -t autoblog-web:latest .
```

**Run Container:**

```bash
docker run -d \
  --name autoblog-web \
  -p 3000:3000 \
  -e AUTOBLOG_SYNC_URL=ws://your-sync-server:3030 \
  -e AUTOBLOG_INDEX_ID=production \
  -e NODE_ENV=production \
  autoblog-web:latest
```

**Docker Compose:**

```yaml
version: '3.8'
services:
  autoblog-web:
    build: .
    ports:
      - '3000:3000'
    environment:
      - AUTOBLOG_SYNC_URL=ws://sync-server:3030
      - AUTOBLOG_INDEX_ID=main
      - NODE_ENV=production
      - PORT=3000
```

### Production Deployment Process

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Verify build output:**

   ```bash
   ls -la dist/client/  # Client assets
   ls -la dist/server/  # Server bundle
   ```

3. **Test production server:**

   ```bash
   npm start
   curl http://localhost:3000/api/config
   ```

4. **Build and deploy Docker image:**
   ```bash
   docker build -t autoblog-web:latest .
   docker run -d -p 3000:3000 \
     -e AUTOBLOG_SYNC_URL=ws://production-server:3030 \
     autoblog-web:latest
   ```

## 🧑‍💻 Code Quality

### Pre-commit Hooks

The project uses Husky and lint-staged for automated code quality checks:

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type checking
- Automatic test execution

### Testing

- Unit tests with Vitest and React Testing Library
- Coverage reporting with v8
- SSR compatibility testing
- Component testing utilities included

**Note**: React component tests (`.tsx` files) are intentionally excluded to focus on business logic testing.

## 🔍 SSR Benefits

- **Improved SEO**: Search engines can crawl pre-rendered content
- **Faster Initial Load**: Users see content immediately before hydration
- **Better Core Web Vitals**: Improved First Contentful Paint (FCP) metrics
- **Progressive Enhancement**: Works even if JavaScript fails to load
- **Secure Configuration**: Sensitive data stays server-side

## 🐛 Troubleshooting

### Common SSR Issues

1. **Hydration Mismatch**: Ensure server and client render the same content
2. **Environment Variables**: Check that production env vars are set correctly
3. **Build Failures**: Verify all dependencies are installed and compatible
4. **Port Conflicts**: Ensure port 3000 is available or set custom PORT

### Debug Commands

```bash
# Check build output
npm run build && ls -la dist/

# Test production server
NODE_ENV=production npm start

# Verify API endpoint
curl http://localhost:3000/api/config

# Check Docker build
docker build -t test-build . && docker run --rm -p 3000:3000 test-build
```

## 📝 Contributing

1. Create a feature branch from `main`
2. Make your changes with appropriate tests
3. Ensure all checks pass: `npm run lint && npm run type-check && npm test`
4. Test SSR functionality in both dev and production modes
5. Submit a pull request

## 🔄 Migration from Static SPA

This version migrates from a static SPA to SSR Express server:

- **Security**: Configuration no longer exposed in client bundles
- **Performance**: Faster initial page loads with SSR
- **SEO**: Better search engine indexing
- **Deployment**: Uses Node.js Express server for SSR

## 🔗 Related

- [Autoblog CLI](../autoblog-cli/) - Command-line tool for managing blog posts
- [Main Documentation](../README.md) - Project overview and architecture
- [Automerge](https://automerge.org/) - CRDT library documentation

## 📄 License

MIT
