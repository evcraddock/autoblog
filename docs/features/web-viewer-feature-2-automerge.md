# Feature 2: Automerge Integration & Data Layer

## Overview
Set up CRDT synchronization with IndexedDB storage and WebSocket networking for the Autoblog Web Viewer using Automerge 2.0.

## Purpose
Implement the core data synchronization layer that connects the web viewer to the Automerge ecosystem, enabling real-time document sync and offline-first functionality.

## Implementation Status
✅ **COMPLETED** - Feature has been successfully implemented with Automerge 2.0 integration.

## Requirements

### Core Integration
- Initialize Automerge repository with IndexedDB storage adapter
- Establish WebSocket connection to sync server for real-time synchronization
- Implement read-only mode to prevent write operations from web viewer
- Generate unique peer ID for each client session

### Data Access Layer
- Create service layer for fetching blog posts and index
- Implement methods to retrieve posts by document ID and slug
- Provide functionality to get all posts and blog index
- Handle document not found scenarios gracefully

### React Integration
- Create React hooks for Automerge state management
- Provide hooks for accessing individual posts and post collections
- Implement context provider for sharing repository instance
- Ensure reactive updates when documents change

### Connection Management (Handled by Automerge)
- ~~Track connection status to sync server~~ - Automerge 2.0 handles this natively
- ~~Implement reconnection logic for network failures~~ - Built into BrowserWebSocketClientAdapter
- ~~Monitor connection health and sync progress~~ - Automerge provides this automatically
- ~~Handle sync conflicts and resolution~~ - CRDT conflicts are resolved automatically

### Type Definitions
- Define TypeScript interfaces for BlogPost and BlogIndex
- Ensure type compatibility with CLI component
- Include all required fields: title, author, published date, status, slug, description, content, and optional image URL

### Error Handling
- Implement recovery mechanisms for network failures
- Handle invalid or corrupted documents
- Provide graceful degradation when sync is unavailable
- Implement proper error boundaries and user feedback

## Acceptance Criteria
- [x] Automerge repository initializes successfully
- [x] IndexedDB storage adapter connects and persists data
- [x] WebSocket client connects to sync server
- [x] React hooks provide reactive data access
- [x] ~~Connection status is tracked and exposed~~ - Simplified (Automerge handles internally)
- [x] Error handling covers network failures
- [x] Type safety is maintained throughout
- [x] Read-only mode is enforced (no write operations)

## Dependencies
- @automerge/automerge@^2.1.10 (latest stable)
- @automerge/automerge-repo@^2.0.7 (Automerge 2.0 upgrade)
- @automerge/automerge-repo-storage-indexeddb@^2.0.7
- @automerge/automerge-repo-network-websocket@^2.0.7
- React hooks (useState, useEffect, useContext, useCallback)

## Security Considerations
- Read-only document access
- Input validation for document IDs
- Network request sanitization
- Error message sanitization

## Performance Considerations
- Document caching strategies
- Lazy loading for large documents
- Connection pooling optimization
- Memory usage monitoring

## Implementation Details

### Architecture Overview
The implementation leverages Automerge 2.0's native capabilities instead of building custom abstractions:

```typescript
// Simple repository initialization
const repo = new Repo({
  storage: new IndexedDBStorageAdapter('autoblog-web'),
  network: [new BrowserWebSocketClientAdapter(syncUrl)]
})

// Custom React Context for repo sharing
const RepoContext = createContext<Repo | null>(null)
export function useRepo(): Repo | null {
  return useContext(RepoContext)
}
```

### Key Components

#### 1. AutomergeProvider Context
- Initializes Automerge repository with IndexedDB storage
- Manages WebSocket connection to sync server 
- Provides repository instance via React context
- Handles cleanup on unmount

#### 2. React Hooks
- `useBlogPosts()` - Fetches and filters all blog posts
- `useBlogPost(slug)` - Gets individual post by slug
- `useBlogIndex()` - Accesses the blog index document
- All hooks work directly with repository instance for better reliability

#### 3. Service Layer
- `initRepo()` - Repository initialization with storage and networking
- `getOrCreateIndex()` - Blog index document management
- `findPostBySlug()` - Efficient post lookup
- Minimal abstractions, leveraging Automerge APIs directly

### Automerge 2.0 Benefits
- **Native Connection Management**: Built-in reconnection, heartbeat, error handling
- **CRDT Conflict Resolution**: Automatic merging of concurrent changes
- **Optimized Networking**: Efficient sync protocols and compression
- **IndexedDB Integration**: Seamless offline-first storage
- **Type Safety**: Better TypeScript support and API consistency

## @automerge/automerge-repo-react-hooks Issue

### Problem
During implementation, we attempted to use the official `@automerge/automerge-repo-react-hooks@2.0.7` package but encountered a critical build issue:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'vite-plugin-dts' 
imported from .../automerge-repo-react-hooks/vite.config.ts
```

### Root Cause
The official React hooks package has a packaging problem where:
- The package includes a `vite.config.ts` file that imports `vite-plugin-dts`
- This dependency is not included in the package's dependencies
- Build tools attempt to resolve this import and fail
- The issue affects the entire build process, not just the hooks functionality

### Solution Implemented
Instead of using the problematic official hooks, we implemented a lightweight custom solution:

1. **Custom RepoContext**: Created our own React context for repository sharing
2. **Simple useRepo Hook**: Basic hook to access repository from context
3. **Direct API Usage**: React hooks work directly with Automerge repository API
4. **Maintained Type Safety**: Full TypeScript support without additional complexity

### Comparison

| Approach | Pros | Cons |
|----------|------|------|
| Official Hooks | - Official support<br>- Potentially more features | - Build issues<br>- Additional dependency<br>- More complex API |
| Custom Implementation | - No build issues<br>- Simpler API<br>- Direct control<br>- Smaller bundle | - No official support<br>- Manual implementation |

### Future Considerations
- Monitor `@automerge/automerge-repo-react-hooks` for fixes to packaging issues
- Consider migrating to official hooks once build problems are resolved
- Current custom implementation provides all needed functionality reliably