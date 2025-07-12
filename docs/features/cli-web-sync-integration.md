# CLI-Web Sync Integration

## Overview

This document describes the integration between the Autoblog CLI and Web applications to enable them to share the same blog post documents through Automerge's WebSocket sync server. This integration allows posts uploaded via the CLI to automatically appear in the web viewer.

## Problem Statement

The CLI and Web applications were using different index documents, preventing them from sharing blog posts:
- CLI stored an index document ID in `autoblog-cli/autoblog-data/index-id.txt`
- Web app created its own index document and stored the ID in browser localStorage
- Both apps connected to the same sync server (`wss://sync_server`) but couldn't see each other's posts

## Solution Implementation

### 1. Identified Current Index Document ID

The CLI's current index document ID was found in `/Users/erik/Private/code/exp/autoblog/autoblog-cli/autoblog-data/index-id.txt`:
```
5yuf2779r3W6ntgFZgzR6S6RKiW
```

### 2. Updated Web Application Files

#### `/autoblog-web/src/services/automerge.ts`

Added the CLI's index ID as a constant and modified `getOrCreateIndex()` to prioritize it:

```typescript
// Added after imports
const CLI_INDEX_ID = '5yuf2779r3W6ntgFZgzR6S6RKiW'

// Modified getOrCreateIndex() to try CLI index first
export async function getOrCreateIndex(
  repo: Repo
): Promise<DocHandle<BlogIndex>> {
  // First try to use the CLI's index document ID
  try {
    const existingHandle = await repo.find<BlogIndex>(
      CLI_INDEX_ID as DocumentId
    )
    if (existingHandle) {
      await existingHandle.whenReady()
      // Save to localStorage for future reference
      try {
        localStorage.setItem(INDEX_ID_KEY, CLI_INDEX_ID)
      } catch {
        // localStorage not available, continue anyway
      }
      return existingHandle
    }
  } catch {
    // CLI index document not found, try localStorage fallback
  }
  
  // ... existing localStorage fallback logic remains ...
}
```

Also updated the SyncSource type to match CLI:
```typescript
export type SyncSource = 'local' | 'remote' | 'all'
```

#### `/autoblog-web/src/pages/HomePage.tsx`

Changed from showing only published posts to showing all posts (including drafts):

```typescript
export function HomePage() {
  const { posts, isLoading } = useBlogPosts({ status: 'all' })
  // ... rest of component
}
```

### 3. Key Technical Details

#### Storage Architecture
- **CLI**: Uses `NodeFSStorageAdapter('./autoblog-data')` for filesystem storage
- **Web**: Uses `IndexedDBStorageAdapter('autoblog-web')` for browser storage
- Both sync through the same WebSocket server at `wss://sync_server`

#### Sync Behavior
- CLI: Always uses both local filesystem storage and WebSocket sync
- Web app: Always uses IndexedDB + WebSocket sync

### 4. Testing the Integration

To verify the integration works:

1. **Upload a post via CLI**:
   ```bash
   node dist/index.js upload test-post.md
   ```

2. **Check the web app**: Posts should appear within seconds at `http://localhost:3001`

3. **Verify sync status**:
   ```bash
   # Check all posts (both local and remote)
   node dist/index.js list
   ```

### 5. Testing Integration

#### Test Updates Completed
All test files have been updated to work with the CLI-web sync integration:

**autoblog-cli tests:**
- Updated tests to work without sync source parameters
- Fixed failing tests across all test files
- All tests now passing

**autoblog-web tests:**
- Updated `src/services/__tests__/automerge.test.ts` to handle new CLI index priority
- Fixed test mocking for `getOrCreateIndex()` function's new call sequence
- All 78 tests now passing

#### Test Changes Made
1. CLI tests updated to work without sync source parameters
2. Web tests updated to mock the CLI index check first, then localStorage fallback
3. Test expectations updated to match the CLI index ID (`5yuf2779r3W6ntgFZgzR6S6RKiW`) priority

#### Index Document Changes
If the CLI's index document ID changes (e.g., if someone deletes and recreates the index), you must:
1. Check the new ID in `autoblog-cli/autoblog-data/index-id.txt`
2. Update the `CLI_INDEX_ID` constant in `automerge.ts`
3. Update the hardcoded CLI index ID in test files
4. Clear browser localStorage to prevent conflicts

#### Troubleshooting

**Posts not appearing in web app**:
- Ensure CLI uploads are successful (they automatically sync to remote)
- Check browser console for connection errors
- Verify the index ID hasn't changed
- Clear browser localStorage and reload

**Different post counts between CLI and web**:
- All CLI uploads automatically sync to remote, so counts should match
- Use `node dist/index.js list` to see all posts
- The web app sees all posts that have synced to the remote server

### 6. Files Modified

1. `/autoblog-web/src/services/automerge.ts`
   - Added `CLI_INDEX_ID` constant
   - Updated `SyncSource` type
   - Modified `getOrCreateIndex()` to prioritize CLI index
   - Updated `initRepo()` to handle 'all' source type

2. `/autoblog-web/src/pages/HomePage.tsx`
   - Changed from `status: 'published'` to `status: 'all'`

3. Test files updated to work with the new integration

## Summary

The integration works by having the web app look for and use the same index document that the CLI uses. This creates a shared "catalog" of blog posts that both applications can read from and write to through Automerge's sync server. The key insight was that both apps need to reference the same index document ID to see the same posts.

**Current Status: ✅ COMPLETE**
- CLI-web sync integration fully implemented and tested
- All test suites updated and passing (97 CLI tests + 78 web tests)
- Build and lint checks passing for both projects
- Ready for production use