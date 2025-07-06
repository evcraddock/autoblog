# Index Management

## Purpose

The index management module provides a centralized registry of all blog posts in the Autoblog system. It maintains a mapping between post slugs and their Automerge document IDs, enabling efficient post discovery and management across all CLI commands.

## Implementation Details

### Core Components

1. **Index Module**: `src/lib/index.ts`
   - Manages the blog index document
   - Persists index ID for consistency
   - Provides CRUD operations for post references
   - Handles index creation and recovery

2. **Index Document Structure**:
   ```typescript
   interface BlogIndex {
     posts: Record<string, string>  // slug -> documentId mapping
     lastUpdated: Date             // Track last modification
   }
   ```

3. **Persistence Strategy**:
   - Index document ID stored in `./autoblog-data/index-id.txt`
   - Survives application restarts
   - Enables consistent access across sessions

### Key Functions

#### `getOrCreateIndex(repo: Repo)`
- Retrieves existing index or creates new one
- Reads persisted index ID from file
- Validates index document still exists
- Falls back to creating new index if needed
- Atomic operation to prevent duplicates

#### `updateIndex(handle, slug, docId)`
- Adds or updates post reference
- Updates lastUpdated timestamp
- Atomic change operation
- Used by upload command

#### `removeFromIndex(handle, slug)`
- Removes post reference by slug
- Updates lastUpdated timestamp
- Used by delete command
- Doesn't delete actual document

#### `findPostBySlug(handle, slug)`
- Looks up document ID by slug
- Returns null if not found
- Read-only operation
- Used for post retrieval

## Configuration

### Storage Location
- Index ID file: `./autoblog-data/index-id.txt`
- Directory created automatically if missing
- Plain text file with single document ID

### Index Document Behavior
- Single source of truth for all posts
- Shared across local and remote sync
- Automatically synced when using remote mode
- Survives network disconnections

## Technical Decisions

### Single Index Document
- **Chosen**: One index document for all posts
- **Benefits**:
  - Simple discovery mechanism
  - Efficient for moderate post counts
  - Easy to sync and manage
  - Clear ownership model

### Persistent ID Storage
- **File-based**: Simple text file storage
- **Benefits**:
  - Survives process restarts
  - No database dependency
  - Easy to backup/restore
  - Human-readable format

### Slug as Primary Key
- Slugs must be unique across system
- Natural identifier from post titles
- URL-friendly for future web viewer
- Deterministic generation from title

### Atomic Operations
- All index updates use Automerge `change()`
- Prevents concurrent modification issues
- Maintains consistency in distributed scenarios
- Automatic conflict resolution

## Error Handling

### Recovery Scenarios
1. **Missing Index File**: Creates new index
2. **Invalid Document ID**: Creates new index
3. **Corrupted Index**: Falls back to new index
4. **Write Permission Issues**: Warns but continues

### Graceful Degradation
- Warning instead of error for file write failures
- Continues operation even without persistence
- Always returns valid index handle

## Testing

### Unit Tests (`tests/unit/index.test.ts`)
- Index creation and retrieval
- ID persistence to file system
- Update operations
- Remove operations
- Slug lookup functionality
- Error recovery scenarios
- File system mocking

### Test Coverage
- New index creation
- Existing index retrieval
- Missing file handling
- Corrupted ID handling
- Concurrent operations
- Edge cases (empty slugs, special characters)

## Usage Patterns

### Upload Command Flow
1. Get or create index
2. Create post document
3. Update index with slug mapping
4. Index automatically synced

### List Command Flow
1. Get index document
2. Iterate through all slug mappings
3. Fetch each post document
4. Display sorted results

### Delete Command Flow
1. Get index document
2. Find post by slug
3. Remove from index
4. Post document remains (logical delete)

## Verification Status

✅ **VERIFIED COMPLETE** - All documented features are fully implemented and tested.

### Implementation Notes
- All core functions (getOrCreateIndex, updateIndex, removeFromIndex, findPostBySlug) working correctly
- BlogIndex interface properly defined with posts mapping and lastUpdated timestamp
- Index ID persistence working via ./autoblog-data/index-id.txt
- Atomic operations using Automerge change() implemented correctly
- Comprehensive error handling and recovery scenarios
- Full TypeScript type safety throughout

### Minor Implementation Details
- Tests located in tests/unit/lib.test.ts (not index.test.ts as documented)
- File system error handling uses console.warn for non-critical failures
- Directory creation works automatically as documented
- Integration with all CLI commands verified and working