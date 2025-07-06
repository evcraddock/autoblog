# List Command

## Purpose

The list command displays all blog posts in the Autoblog system in a formatted table. It provides a quick overview of all posts with their metadata, sorted by publication date (newest first), and supports both local and remote data sources.

## Implementation Details

### Core Components

1. **Command Handler**: `src/commands/list.ts`
   - Fetches posts from specified source
   - Handles empty state gracefully
   - Formats output in a table
   - Color-codes status indicators
   - Manages process termination

2. **Data Retrieval**: `src/lib/automerge.ts`
   - `listBlogPosts()` function retrieves all posts
   - Loads index document to find all post IDs
   - Fetches each post document
   - Sorts by published date (newest first)

3. **Table Formatting**: `cli-table3` library
   - Fixed column widths for consistent display
   - Word wrapping for long content
   - Colored headers for better readability

### Configuration

#### Command Options
- `--source <source>`: Choose sync source (default: 'remote')
  - `local`: Read from local file system only
  - `remote`: Sync with Automerge server at `wss://sync.automerge.org`

#### Table Columns
1. **Title** (30 chars): Post title with word wrap
2. **Slug** (25 chars): URL-safe identifier
3. **Author** (20 chars): Author name
4. **Published** (12 chars): Formatted date
5. **Status** (10 chars): Color-coded draft/published

## Usage Examples

### List All Posts (Remote)
```bash
autoblog list
```

### List Posts from Local Storage
```bash
autoblog list --source local
```

### Example Output
```
📚 Fetching blog posts from remote source...

Found 3 posts (🌐 Remote):

┌──────────────────────────────┬─────────────────────────┬────────────────────┬────────────┬──────────┐
│ Title                        │ Slug                    │ Author             │ Published  │ Status   │
├──────────────────────────────┼─────────────────────────┼────────────────────┼────────────┼──────────┤
│ Getting Started with         │ getting-started-with-   │ Jane Doe           │ 1/15/2024  │ published│
│ Autoblog                     │ autoblog                │                    │            │          │
├──────────────────────────────┼─────────────────────────┼────────────────────┼────────────┼──────────┤
│ Building Local-First Apps    │ building-local-first-   │ John Smith         │ 1/10/2024  │ published│
│                              │ apps                    │                    │            │          │
├──────────────────────────────┼─────────────────────────┼────────────────────┼────────────┼──────────┤
│ Draft: Future of Blogging    │ draft-future-of-        │ Alice Johnson      │ 1/5/2024   │ draft    │
│                              │ blogging                │                    │            │          │
└──────────────────────────────┴─────────────────────────┴────────────────────┴────────────┴──────────┘
```

## Technical Decisions

### Sorting Strategy
- Posts sorted by published date, newest first
- Consistent ordering for better user experience
- Sorting happens after all posts are loaded

### Display Format
- Table format chosen for structured data presentation
- Fixed column widths prevent layout issues
- Word wrapping for long titles
- Color coding for visual status indication:
  - Green: Published posts
  - Yellow: Draft posts

### Source Indicators
- 📱 Local: Indicates local storage source
- 🌐 Remote: Indicates remote sync source
- Clear visual feedback about data source

### Empty State Handling
- Specific message when no posts found
- Yellow color indicates warning/info state
- Graceful exit without errors

## Error Handling

### Common Errors
- Index document not found
- Network connectivity issues (remote mode)
- Corrupted post documents
- Missing post references in index

### Error Messages
All errors prefixed with "List failed:" for consistency with other commands.

## Testing

### Unit Tests (`tests/unit/list.test.ts`)
- Empty post list scenario
- Single post display
- Multiple posts with sorting
- Status color coding
- Source indicator display
- Error handling scenarios

### Test Coverage
- Table formatting with various content lengths
- Date formatting consistency
- Mock Automerge repository
- Network failure simulation (remote mode)

## Future Considerations

### Potential Enhancements
1. **Filtering Options**:
   - Filter by status (draft/published)
   - Filter by author
   - Filter by date range
   - Search by title/content

2. **Sorting Options**:
   - Sort by title
   - Sort by author
   - Sort by status
   - Reverse sort order

3. **Output Formats**:
   - JSON output for scripting
   - CSV export
   - Simplified list view
   - Detailed view with descriptions

4. **Pagination**:
   - Limit results per page
   - Navigation between pages
   - Configurable page size

5. **Performance**:
   - Lazy loading for large datasets
   - Parallel document fetching
   - Caching for repeated queries

### Display Improvements
- Truncate long descriptions with ellipsis
- Show post word count
- Display last modified date
- Include post tags/categories
- Show sync status indicators