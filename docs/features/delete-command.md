# Delete Command

## Purpose

The delete command removes blog posts from the Autoblog system by their slug identifier. It implements a logical deletion approach by removing the post reference from the index document, making the post unreachable while preserving the actual document for potential recovery or audit purposes.

## Implementation Details

### Core Components

1. **Command Handler**: `src/commands/delete.ts`
   - Validates slug parameter
   - Provides user feedback
   - Handles post not found scenario
   - Manages process termination

2. **Deletion Logic**: `src/lib/automerge.ts`
   - `deleteBlogPost()` function handles the deletion
   - Removes slug from index document
   - Returns boolean indicating success
   - Preserves the actual post document

3. **Index Management**: `src/lib/index.ts`
   - `removeFromIndex()` removes the slug mapping
   - Atomic operation to prevent corruption
   - Updates lastUpdated timestamp

### Configuration

#### Command Options
- `--source <source>`: Choose sync source (default: 'remote')
  - `local`: Delete from local storage only
  - `remote`: Delete from synced storage

#### Deletion Strategy
- **Logical Deletion**: Removes reference from index, not the document
- **No Confirmation**: Direct deletion without prompts
- **Idempotent**: Safe to call multiple times

## Usage Examples

### Delete a Post (Remote)
```bash
autoblog delete my-post-slug
```

### Delete from Local Storage
```bash
autoblog delete my-post-slug --source local
```

### Example Outputs

#### Successful Deletion
```
🗑️ Deleting post with slug: my-post-slug
✅ Successfully deleted post: my-post-slug
```

#### Post Not Found
```
🗑️ Deleting post with slug: non-existent-slug
Post not found with slug: non-existent-slug
```

## Technical Decisions

### Logical vs Physical Deletion
- **Chosen**: Logical deletion (remove from index)
- **Benefits**:
  - Recoverable if needed
  - Preserves document history
  - Safer for distributed systems
  - Audit trail maintained

### No Confirmation Prompt
- Direct deletion for CLI efficiency
- Follows Unix philosophy
- Can be wrapped in scripts easily
- Future enhancement could add `--confirm` flag

### Return Value Strategy
- Boolean return indicates if post existed
- Allows graceful handling of missing posts
- No exception thrown for non-existent slugs

## Error Handling

### Validation Errors
- Empty or whitespace-only slug
- Missing slug parameter

### Runtime Errors
- Index document not found
- Network issues (remote mode)
- Automerge operation failures

### User-Friendly Messages
- Clear indication when post not found
- Yellow color for warnings (not errors)
- Consistent error prefix "Delete failed:"

## Testing

### Unit Tests (`tests/unit/delete.test.ts`)
- Valid slug deletion
- Non-existent slug handling
- Empty slug validation
- Whitespace slug handling
- Index update verification
- Error scenario coverage

### Test Scenarios
1. **Happy Path**: Delete existing post
2. **Not Found**: Attempt to delete non-existent post
3. **Empty Input**: Various invalid slug formats
4. **Index State**: Verify index updates correctly
5. **Idempotency**: Delete same post twice

## Future Considerations

### Potential Enhancements

1. **Confirmation Options**:
   - `--confirm` flag for interactive confirmation
   - `--force` flag to skip any warnings
   - Show post details before deletion

2. **Batch Operations**:
   - Delete multiple posts by pattern
   - Delete by author or date range
   - Bulk deletion from file list

3. **Recovery Features**:
   - `undelete` command to restore posts
   - List recently deleted posts
   - Trash/recycle bin concept

4. **Cascade Options**:
   - Delete associated assets
   - Clean up orphaned documents
   - Remove related comments (future)

5. **Audit Features**:
   - Log deletions with timestamp
   - Track who deleted what
   - Deletion history report

### Safety Improvements
- Backup before deletion option
- Soft delete with expiration
- Require specific permissions
- Rate limiting for bulk deletes

### Integration Considerations
- Webhook notifications on deletion
- Update RSS feeds automatically
- Clear CDN caches if applicable
- Notify subscribers of removal