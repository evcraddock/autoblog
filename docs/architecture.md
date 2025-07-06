# Autoblog Architecture Plan

## Overview
This document outlines the technical architecture for building a local-first blog platform using Automerge 2.0. The system consists of two main applications: a CLI tool for content management and a web application for public viewing.

## System Architecture

### High-Level Design
```
┌─────────────────┐         ┌──────────────────┐
│   CLI Tool      │         │   Web Viewer     │
│  (Node.js/TS)   │         │  (Browser/TS)    │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │      WebSocket            │ WebSocket
         │                           │
    ┌────▼───────────────────────────▼────┐
    │         Sync Server                 │
    │    (Automerge Sync Protocol)        │
    │  - Document synchronization         │
    │  - Connection management            │
    └────┬─────────────────────────────────┘
         │
    ┌────▼───────────────────────────┬────┐
    │         Automerge 2.0 Layer    │    │
    │  - CRDT Document Management    │    │
    │  - Conflict Resolution         │    │
    │  - Version History             │    │
    └────┬───────────────────────────┴────┘
         │                           │
    ┌────▼─────┐              ┌─────▼──────┐
    │  NodeFS  │              │ IndexedDB  │
    │ Storage  │              │  Storage   │
    └──────────┘              └────────────┘
```

### Data Flow
1. Author writes markdown files locally
2. CLI tool uploads files to Automerge documents (stored in NodeFS)
3. CLI syncs documents to the sync server via WebSocket
4. Web viewer connects to sync server and pulls documents
5. Web viewer caches documents in IndexedDB for offline access
6. Changes from either side are automatically synchronized

## Application 1: CLI Tool

### Purpose
Command-line interface for authors to upload markdown files to the blog system.

### Technology Stack
- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **Dependencies**:
  - `@automerge/automerge` (v2.0+)
  - `@automerge/automerge-repo`
  - `@automerge/automerge-repo-storage-nodefs`
  - `@automerge/automerge-repo-network-websocket`
  - `commander` (CLI framework)
  - `gray-matter` (frontmatter parsing)
  - `chalk` (terminal styling)
- **Testing Stack**:
  - `vitest` (test runner and assertions)
  - `@vitest/ui` (optional web UI for tests)
  - `memfs` (mock file system operations)
  - `execa` (CLI execution testing)

### Project Structure
```
autoblog-cli/
├── src/
│   ├── index.ts           # Entry point
│   ├── commands/
│   │   └── upload.ts      # Upload command implementation
│   ├── lib/
│   │   ├── automerge.ts   # Automerge initialization & config
│   │   ├── parser.ts      # Markdown/frontmatter parsing
│   │   └── post.ts        # Post document operations
│   └── types/
│       └── index.ts       # TypeScript interfaces
├── package.json
├── tsconfig.json
└── README.md
```

### Core Functionality

#### 1. Automerge Repository Setup
```typescript
// lib/automerge.ts
import { Repo } from "@automerge/automerge-repo"
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs"
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"

export function initRepo() {
  const storage = new NodeFSStorageAdapter("./autoblog-data")
  const network = [new WebSocketClientAdapter("ws://localhost:3030")] // Or wss://sync.automerge.org
  
  return new Repo({ 
    storage,
    network 
  })
}
```

#### 2. Post Document Schema
```typescript
// types/index.ts
export interface BlogPost {
  title: string
  author: string
  published: Date
  status: 'draft' | 'published'
  slug: string
  description: string
  content: string
  imageUrl?: string
}

export interface BlogIndex {
  posts: Record<string, string> // slug -> documentId mapping
  lastUpdated: Date
}
```

#### 3. Upload Command
```typescript
// commands/upload.ts
export async function uploadPost(filePath: string) {
  // 1. Read and parse markdown file
  // 2. Extract frontmatter and content
  // 3. Create or update Automerge document
  // 4. Update index document
  // 5. Save to storage
}
```

### CLI Usage
```bash
# Install globally
npm install -g autoblog-cli

# Upload a post
autoblog upload ./posts/my-post.md

# Future features
autoblog list                    # List all posts
autoblog delete <slug>           # Remove a post
autoblog sync                    # Sync with remote
```

## Application 2: Web Viewer

### Purpose
Public-facing website for reading blog posts with local-first capabilities.

### Technology Stack
- **Framework**: React
- **Build Tool**: Vite
- **Language**: TypeScript
- **Dependencies**:
  - `react` (v18+)
  - `react-dom` (v18+)
  - `@automerge/automerge` (v2.0+)
  - `@automerge/automerge-repo`
  - `@automerge/automerge-repo-storage-indexeddb`
  - `@automerge/automerge-repo-network-websocket`
  - `marked` (markdown rendering)
  - `prismjs` (syntax highlighting)

### Project Structure
```
autoblog-web/
├── src/
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Main app component
│   ├── lib/
│   │   ├── automerge.ts   # Automerge client setup
│   │   ├── posts.ts       # Post fetching logic
│   │   └── renderer.ts    # Markdown to HTML
│   ├── components/
│   │   ├── PostList.tsx   # List view component
│   │   └── PostView.tsx   # Single post component
│   ├── styles/
│   │   └── main.css       # Styling
│   └── types/
│       └── index.ts       # Shared types
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Core Functionality

#### 1. Automerge Client Setup
```typescript
// lib/automerge.ts
import { Repo } from "@automerge/automerge-repo"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"

export function initRepo() {
  const storage = new IndexedDBStorageAdapter()
  const network = [new WebSocketClientAdapter("ws://localhost:3030")] // Same server as CLI
  
  return new Repo({ 
    storage,
    network 
  })
}
```

#### 2. Post Rendering
```typescript
// lib/renderer.ts
import { marked } from 'marked'
import Prism from 'prismjs'

export function renderMarkdown(content: string): string {
  // Configure marked with syntax highlighting
  return marked(content)
}
```

#### 3. Routing
Simple hash-based routing for MVP:
- `#/` - Post list
- `#/post/:slug` - Individual post

### UI Components (React)
- **Post List**: Grid/list of post cards with title, description, date
- **Post View**: Full post with rendered markdown
- **Navigation**: Simple header with home link
- **Loading States**: Skeleton screens while fetching

## Shared Considerations

### Automerge Document Strategy

#### 1. Index Document
- Single document containing post metadata
- Maps slugs to document IDs
- Enables efficient post discovery

#### 2. Post Documents
- One Automerge document per blog post
- Contains full post content and metadata
- Enables granular sync and versioning

### Sync Server Options

#### Option 1: Automerge Sync Server (Recommended for MVP)
- Use the public sync server at `wss://sync.automerge.org`
- No setup required
- Replace `ws://localhost:3030` with `wss://sync.automerge.org` in both apps

#### Option 2: Self-Hosted Sync Server
```bash
# Using automerge-repo-sync-server
npm install -g @automerge/automerge-repo-sync-server
automerge-repo-sync-server --port 3030
```

#### Option 3: Custom Sync Server
```typescript
// sync-server.ts
import { WebSocketServer } from "@automerge/automerge-repo-network-websocket"

const wss = new WebSocketServer({ port: 3030 })
console.log("Sync server running on ws://localhost:3030")
```

### Error Handling
- Graceful degradation when offline
- Clear error messages for conflicts
- Retry mechanisms for network operations

### Performance Optimizations
- Lazy load post content
- Cache rendered HTML
- Implement virtual scrolling for large post lists
- Use Automerge's incremental updates

## Development Workflow

### Phase 1: MVP
1. Set up both project structures
2. Implement Automerge integration with sync server
3. Build upload command in CLI
4. Create read-only web viewer
5. Test with sample posts using public sync server

### Phase 2: Enhancements
1. Self-hosted sync server
2. Implement post search
3. Add pagination
4. Build admin interface
5. Support for drafts

### Phase 3: Advanced Features
1. Collaborative editing
2. Comment system
3. RSS feed generation
4. Analytics integration
5. Theme customization

## Testing Strategy

### CLI Tool
**Framework**: Vitest with TypeScript support

**Unit Tests**:
- Markdown parser (frontmatter extraction, slug generation)
- Automerge integration (document creation, error handling)
- Utility functions and type validation

**Integration Tests**:
- CLI commands with mocked file system (using `memfs`)
- Upload workflow with mocked Automerge repo
- Error scenarios and edge cases

**E2E Tests**:
- Full CLI execution using `execa`
- Real markdown file processing
- Actual Automerge document creation

**Mocking Strategy**:
- Use `vi.mock()` to stub `@automerge/automerge-repo`
- Mock file system operations with `memfs`
- Create test doubles for network operations

### Web Viewer
- Component tests for UI elements
- Integration tests for Automerge reading
- Visual regression tests
- Performance benchmarks

## Deployment

### CLI Tool
- Publish to npm registry
- Provide pre-built binaries
- Docker image for server deployment

### Web Viewer
- Static hosting (Netlify, Vercel, GitHub Pages)
- CDN for assets
- Service worker for offline support

## Security Considerations
- Validate markdown content
- Sanitize HTML output
- Rate limit sync operations
- Implement read-only mode properly

## Monitoring & Maintenance
- Error tracking (Sentry)
- Performance monitoring
- Usage analytics (privacy-respecting)
- Regular dependency updates

This architecture provides a solid foundation for building a local-first blog platform that leverages Automerge's powerful CRDT capabilities while maintaining simplicity for the MVP.