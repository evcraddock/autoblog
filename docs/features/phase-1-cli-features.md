# Phase 1 CLI Features - Implementation Context

This document provides the implementation context for each Phase 1 CLI feature. Each section contains all necessary information for implementing that specific feature independently.

## Implementation Status

**Progress: 3/5 Features Completed (60%)**

- ✅ **Index Management Module** - Completed (PR #14)
- ✅ **List Command** - Completed (PR #15)  
- ✅ **Delete Command** - Completed (PR #16)
- ⏳ **Sync Command** - Pending
- ⏳ **Enhanced Error Handling** - Pending

### Completed Features
All completed features include:
- ✅ Full implementation with TypeScript
- ✅ Comprehensive unit tests
- ✅ CLI integration
- ✅ Documentation updates
- ✅ Manual testing verification

## ✅ Feature 1: List Command - Display All Posts [COMPLETED]

> **Implementation Notes**: 
> - ✅ Implemented with cli-table3 for formatted output
> - ✅ Sorts posts by published date (newest first)
> - ✅ Color-coded status indicators
> - ✅ Handles empty state and missing posts gracefully
> - ✅ 6 comprehensive unit tests covering all scenarios

### Command Specification
- **Command**: `autoblog list`
- **Description**: List all blog posts with their metadata
- **Output**: Table or list format showing title, slug, author, published date, and status

### Technical Context

#### Dependencies Required
- Existing: `@automerge/automerge-repo`, `chalk`, `commander`
- New: Consider adding `cli-table3` for formatted output

#### Type Definitions Needed
```typescript
// Already exists in types/index.ts
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

#### Implementation Requirements
1. Create `src/commands/list.ts`
2. Connect to Automerge repo using existing `initRepo()` from `lib/automerge.ts`
3. Find and load the index document
4. For each post in the index:
   - Load the post document by ID
   - Extract metadata (title, author, published, status)
   - Display in formatted output
5. Handle cases:
   - No index document exists
   - Empty post list
   - Failed document loads

#### Integration Points
- Add command to `src/index.ts` CLI entry point
- Use existing Automerge initialization from `lib/automerge.ts`
- Reuse document loading patterns from `lib/post.ts`

#### Testing Requirements
- Unit tests for list formatting logic
- Integration tests with mocked Automerge repo
- Test empty state, single post, multiple posts
- Test error handling (missing index, corrupt documents)

---

## ✅ Feature 2: Delete Command - Remove Posts [COMPLETED]

> **Implementation Notes**: 
> - ✅ Logical deletion approach (removes from index, making posts unreachable)
> - ✅ Robust input validation and error handling
> - ✅ Graceful handling of non-existent slugs and missing documents
> - ✅ Maintains data consistency even when operations partially fail
> - ✅ 9 comprehensive unit tests covering all error scenarios

### Command Specification
- **Command**: `autoblog delete <slug>`
- **Description**: Remove a blog post by its slug
- **Output**: Confirmation message or error

### Technical Context

#### Dependencies Required
- Existing: All current dependencies sufficient
- Optional: `inquirer` for confirmation prompt

#### Implementation Requirements
1. Create `src/commands/delete.ts`
2. Accept slug parameter
3. Load index document
4. Find post ID by slug
5. Delete the post document
6. Remove slug from index
7. Update index document
8. Provide confirmation or error message

#### Error Handling
- Post not found
- Index document missing
- Network/sync errors
- Confirmation before deletion (optional)

#### Integration Points
- Add command to `src/index.ts`
- Use existing Automerge repo initialization
- Update shared index management logic

#### Testing Requirements
- Test successful deletion
- Test non-existent slug
- Test index updates
- Mock user confirmation if implemented

---

## ⏳ Feature 3: Sync Command - Manual Synchronization [PENDING]

### Command Specification
- **Command**: `autoblog sync`
- **Description**: Manually trigger synchronization with remote server
- **Output**: Sync status and statistics

### Technical Context

#### Current Sync Configuration
```typescript
// From lib/automerge.ts
const network = [new WebSocketClientAdapter("wss://sync.automerge.org")]
```

#### Implementation Requirements
1. Create `src/commands/sync.ts`
2. Initialize repo with network adapter
3. Trigger manual sync for all documents
4. Monitor sync progress
5. Report:
   - Number of documents synced
   - Bytes transferred
   - Connection status
   - Any sync errors

#### Sync Behavior
- By default, Automerge syncs automatically on connection
- This command forces immediate sync
- Shows sync progress/status
- Useful for debugging connectivity

#### Integration Points
- Add command to `src/index.ts`
- May need to expose sync events from repo
- Consider adding sync status to other commands

#### Testing Requirements
- Mock WebSocket connection
- Test successful sync scenario
- Test offline/error scenarios
- Verify sync statistics calculation

---

## ✅ Feature 4: Index Document Management [COMPLETED]

> **Implementation Notes**: 
> - ✅ Persistent storage of index document ID in `./autoblog-data/index-id.txt`
> - ✅ Atomic operations to prevent data corruption
> - ✅ Handles both new index creation and existing index retrieval
> - ✅ Shared by all commands (upload, list, delete) for consistency
> - ✅ 9 unit tests including fs mocking for persistent storage

### Context
All features depend on a shared index document that maps slugs to document IDs. This needs robust management.

### Technical Requirements

#### Index Document Structure
```typescript
interface BlogIndex {
  posts: Record<string, string> // slug -> documentId mapping
  lastUpdated: Date
}
```

#### Index Management Module
Create `src/lib/index.ts` with:
```typescript
export async function getOrCreateIndex(repo: Repo): Promise<DocHandle<BlogIndex>>
export async function updateIndex(handle: DocHandle<BlogIndex>, slug: string, docId: string)
export async function removeFromIndex(handle: DocHandle<BlogIndex>, slug: string)
export async function findPostBySlug(handle: DocHandle<BlogIndex>, slug: string): Promise<string | null>
```

#### Considerations
- Index document should have a well-known ID
- Handle case where index doesn't exist
- Atomic updates to prevent conflicts
- Consider caching for performance

---

## ⏳ Feature 5: Enhanced Error Handling and User Feedback [PENDING]

### Context
All commands need consistent error handling and user feedback.

### Requirements
1. Consistent error messages with chalk styling
2. Verbose mode for debugging
3. Progress indicators for long operations
4. Network status awareness

### Implementation Patterns
```typescript
// Error handling wrapper
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T | null>

// Progress indicator
export function showProgress(message: string): () => void

// Network status check
export async function checkNetworkStatus(repo: Repo): Promise<boolean>
```

---

## Common Implementation Patterns

### Automerge Repository Initialization
```typescript
// Reuse from lib/automerge.ts
import { initRepo } from '../lib/automerge.js'

const repo = initRepo()
```

### Document Loading Pattern
```typescript
const handle = repo.find<T>(documentId)
await handle.whenReady()
const doc = await handle.doc()
```

### Command Structure Template
```typescript
export async function commandName(param: string, options: any) {
  try {
    const repo = initRepo()
    // Command logic
    console.log(chalk.green('Success message'))
  } catch (error) {
    console.error(chalk.red('Error:', error.message))
    process.exit(1)
  }
}
```

### Testing Template
```typescript
describe('command name', () => {
  beforeEach(() => {
    vi.mock('@automerge/automerge-repo')
  })

  it('should perform expected action', async () => {
    // Test implementation
  })
})
```

---

## Development Order Progress

1. ✅ **Index Management Module** - Required by all features [COMPLETED]
2. ✅ **List Command** - Simplest, validates index access [COMPLETED] 
3. ✅ **Delete Command** - Builds on list, modifies index [COMPLETED]
4. ⏳ **Sync Command** - Independent, useful for testing [NEXT]
5. ⏳ **Error Handling Utilities** - Enhance all commands [PENDING]

This order ensures each feature builds on previous work and maintains testability throughout development. The first three features are now complete and working together seamlessly.