# Web Viewer Feature 2: Automerge Integration & Data Layer

## Overview

The Automerge Integration & Data Layer enables the web viewer to display blog posts that are uploaded via the CLI tool. This feature creates a real-time, offline-capable connection between the command-line authoring tool and the web-based reading experience using Conflict-free Replicated Data Types (CRDTs).

## How It Works

### The Big Picture

When authors upload blog posts using the CLI tool, those posts become available to web viewers in real-time without requiring a traditional database or server infrastructure. The system uses Automerge's distributed synchronization technology to keep all clients in sync.

### Data Flow

1. **Author writes** a blog post as a markdown file locally
2. **CLI uploads** the post to Automerge's public sync server
3. **Web viewers** automatically receive the new post through a WebSocket connection
4. **Posts are cached** locally in the browser for offline reading
5. **UI updates** happen automatically when new posts arrive

### Core Architecture

The feature is built on three foundational layers:

**Storage Layer**: Uses the browser's IndexedDB to store blog posts locally. This means readers can access previously loaded posts even when offline. Each blog post and the master index are stored as separate documents that can be efficiently retrieved.

**Network Layer**: Maintains a WebSocket connection to Automerge's public synchronization server. This connection listens for changes from the CLI tool and automatically downloads new or updated blog posts. The connection handles reconnection automatically if the network drops.

**React Integration Layer**: Provides a seamless interface between the synchronized data and React components. When documents change, React components automatically re-render to show the updated content without manual refresh.

## Key Capabilities

### Real-Time Synchronization

When an author publishes a new blog post using the CLI, all web viewers receive the update within seconds. There's no need to refresh the page or manually check for new content. The synchronization happens transparently in the background.

### Offline Reading

Once blog posts are loaded, they remain available even when the internet connection is lost. The browser stores all content locally, allowing readers to browse previously visited posts without connectivity. When the connection returns, any new posts are automatically synchronized.

### Automatic Content Discovery

The system maintains a master index that tracks all available blog posts. Web viewers automatically discover new posts as they're published, without needing to know specific post URLs or identifiers. The index updates in real-time as authors add or modify content.

### Reactive User Interface

React components automatically update when new blog posts arrive or existing posts are modified. Loading states are handled intelligently - components show loading indicators while content is being fetched and smoothly transition to displaying the actual content once it's available.

## Data Organization

### Blog Posts

Each blog post contains comprehensive metadata including the title, author, publication date, status (draft or published), and a URL-friendly slug. The full markdown content is stored along with an optional description for preview purposes. Posts can include header images specified by URL.

### Master Index

A central index document maps user-friendly post slugs to internal document identifiers. This allows the web viewer to find specific posts by their readable URLs while maintaining efficient internal referencing. The index tracks when it was last updated to help with synchronization.

### Type Safety

All data structures are fully typed using TypeScript interfaces that are shared between the CLI and web components. This ensures consistency between what authors upload and what readers see, preventing data format mismatches.

## User Experience Features

### Flexible Loading Patterns

The system supports two different loading approaches. The standard pattern shows explicit loading states with spinners or placeholder text while content is being fetched. The Suspense pattern provides smoother transitions by automatically handling loading states at the component boundary level.

### Content Filtering

Readers can filter blog posts by publication status (published only, drafts only, or all posts), limit the number of posts displayed, or filter by specific authors. These filters work on the locally cached data for immediate response.

### Manual Refresh

While synchronization happens automatically, readers can manually trigger a refresh to immediately check for new content. This is useful when readers know new content should be available but want to ensure they have the latest version.

### Error Recovery

When network issues occur, the system degrades gracefully. Previously loaded content remains available, and clear error messages inform users about connectivity problems. Once connectivity returns, synchronization resumes automatically.

## Technical Benefits

### No Server Infrastructure

The web viewer doesn't require a traditional backend server, database, or API. All synchronization is handled through Automerge's infrastructure, reducing deployment complexity and operational overhead.

### Conflict-Free Operation

Multiple authors can work simultaneously without worrying about conflicts. The CRDT technology automatically merges changes in a mathematically consistent way, eliminating the need for complex conflict resolution.

### Browser Compatibility

The feature works in all modern browsers that support IndexedDB and WebSockets. This covers the vast majority of current browser usage without requiring special plugins or extensions.

### Performance Optimization

Content is cached locally for immediate access. The system only transfers changes rather than entire documents, minimizing bandwidth usage. Loading states are optimized to provide smooth user experiences even on slower connections.

## Security Model

### Read-Only Access

Web viewers can only read blog posts - they cannot create, modify, or delete content. This separation ensures that the public-facing website cannot be compromised to alter the author's content.

### Data Validation

All incoming data is validated against expected formats before being displayed. Document identifiers are checked for validity to prevent malicious content injection.

### Secure Communication

All network communication uses secure WebSocket connections (WSS) to prevent eavesdropping or tampering during data transmission.

## Quality Assurance

### Automated Testing

The feature includes comprehensive test coverage focusing on the most critical paths: repository initialization, error handling, and component lifecycle management. Tests are designed to run quickly and reliably without over-mocking Automerge internals.

### Error Monitoring

Errors are logged to the browser console with sufficient detail for debugging while avoiding exposure of sensitive information. Different error types (network, storage, validation) are clearly categorized.

### Performance Monitoring

The system tracks loading times and provides hooks for monitoring storage usage and memory consumption. This helps identify performance bottlenecks and optimize the user experience.

## Troubleshooting

### Common Issues

**Content Not Loading**: Usually indicates either the browser doesn't support required features (IndexedDB/WebSockets) or the sync server is unreachable. Check browser compatibility and network connectivity.

**Posts Not Appearing**: Verify that the blog index document exists and contains references to the expected posts. The master index might need to be regenerated if it becomes corrupted.

**Performance Problems**: Large numbers of posts or very long post content can slow loading. Consider implementing pagination or lazy loading for sites with extensive content libraries.

### Performance Optimization

The system performs best when using the Suspense-based loading patterns, which provide smoother user experiences. For sites with many posts, implementing pagination prevents loading too much content at once. Regular monitoring of IndexedDB usage helps identify when cache cleanup might be needed.