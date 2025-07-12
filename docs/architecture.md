# Autoblog Architecture

## Overview
This document outlines the technical architecture for the Autoblog platform - a local-first blog system using Automerge 2.0. The current implementation includes a feature-complete CLI tool for content management. A web viewer application was originally planned but has not been implemented.

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
  const network = [new WebSocketClientAdapter("ws://localhost:3030")] // Or wss://sync_server
  
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

# Upload a post (syncs to remote by default)
autoblog upload ./posts/my-post.md

# Upload to local storage only
autoblog upload ./posts/my-post.md --source local

# List all posts
autoblog list

# List posts from local storage only
autoblog list --source local

# Remove a post by slug
autoblog delete <slug>

# All commands support --source option for local/remote operation
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
- Use the public sync server at `wss://sync_server`
- No setup required
- Replace `ws://localhost:3030` with `wss://sync_server` in both apps

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

### Phase 1: CLI Tool (COMPLETED)
The CLI tool has been completed with the following features:
1. ✅ Upload command - Upload markdown files with frontmatter
2. ✅ List command - Display all posts in formatted table
3. ✅ Delete command - Remove posts by slug
4. ✅ Index management - Centralized post registry
5. ✅ Sync source support - Local/remote operation modes

### Phase 2: Web Viewer (NOT IMPLEMENTED)
The web viewer application was planned but has not been implemented. This would have included:
- React-based web application
- Read-only blog post viewing
- IndexedDB storage for offline access
- WebSocket sync with Automerge server

### Future Considerations
The following features were considered but are not part of the current implementation:
- RSS feed generation
- Comment system  
- Collaborative editing
- Analytics integration
- Theme customization
- Post search functionality
- Pagination support

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