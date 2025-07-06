# Sync Source Support

## Purpose

Sync source support allows all Autoblog CLI commands to operate in either local-only mode or with remote synchronization. This feature provides flexibility for users to work offline, maintain private local blogs, or sync content across devices using Automerge's distributed architecture.

## Implementation Details

### Core Components

1. **Repository Initialization**: `src/lib/automerge.ts`
   - `initRepo(source)` configures storage and network
   - Conditional network adapter based on source
   - Same storage location for both modes

2. **Source Type Definition**:
   ```typescript
   export type SyncSource = 'local' | 'remote';
   ```

3. **Command Integration**:
   - All commands accept `--source` option
   - Default value: 'remote'
   - Passed to repository initialization

### Configuration Modes

#### Local Mode (`--source local`)
- **Storage**: NodeFS adapter at `./autoblog-data/`
- **Network**: No network adapter configured
- **Behavior**: 
  - All operations are offline
  - No WebSocket connections
  - Data stays on local machine
  - Fast operations, no network latency

#### Remote Mode (`--source remote`)
- **Storage**: NodeFS adapter at `./autoblog-data/`
- **Network**: WebSocket to `wss://sync.automerge.org`
- **Behavior**:
  - Automatic synchronization
  - Cross-device accessibility
  - Real-time updates
  - Requires internet connection

## Usage Examples

### Upload Commands
```bash
# Upload with remote sync (default)
autoblog upload post.md

# Upload to local storage only
autoblog upload post.md --source local

# Explicitly specify remote
autoblog upload post.md --source remote
```

### List Commands
```bash
# List from remote (includes synced posts)
autoblog list

# List from local storage only
autoblog list --source local
```

### Delete Commands
```bash
# Delete from remote
autoblog delete my-post

# Delete from local only
autoblog delete my-post --source local
```

## Technical Decisions

### Unified Storage Location
- Both modes use `./autoblog-data/`
- Simplifies data management
- Easy to switch between modes
- No data duplication

### Default to Remote
- Encourages distributed usage
- Matches typical blog workflow
- Local mode for special cases
- Explicit opt-in for offline

### Network Adapter Strategy
- Conditional initialization
- No adapter for local mode
- Clean separation of concerns
- Reduces resource usage offline

### Public Sync Server
- Uses `wss://sync.automerge.org`
- No server setup required
- Free for public data
- Well-maintained infrastructure

## Error Handling

### Network Failures (Remote Mode)
- Connection errors logged
- Operations may timeout
- Local changes preserved
- Sync resumes when online

### Local Mode Constraints
- No cross-device sync
- Manual backup needed
- No collaboration features
- Data isolation guaranteed

## Testing

### Unit Tests
- Mock network adapter creation
- Verify correct mode configuration
- Test both source options
- Ensure proper initialization

### Integration Scenarios
1. **Mode Switching**: Same data accessible in both modes
2. **Offline First**: Local mode works without network
3. **Sync Verification**: Remote mode connects properly
4. **Error Resilience**: Graceful network failures

## Use Cases

### Local Mode Use Cases
1. **Private Blogs**: Content never leaves machine
2. **Development**: Fast iteration without sync delays
3. **Offline Writing**: Work without internet
4. **Compliance**: Data residency requirements

### Remote Mode Use Cases
1. **Multi-Device**: Write on laptop, publish from server
2. **Collaboration**: Multiple authors (future)
3. **Backup**: Automatic off-site storage
4. **Publishing**: Web viewer can access posts

## Migration Scenarios

### Local to Remote
1. Start with `--source local`
2. Write posts offline
3. Switch to `--source remote`
4. Existing posts sync automatically

### Remote to Local
1. Use `--source remote` normally
2. Switch to `--source local`
3. Previously synced posts available
4. New changes stay local

## Future Considerations

### Enhanced Features
1. **Hybrid Mode**: Selective sync per post
2. **Custom Servers**: User-specified sync URLs
3. **Sync Status**: Show connection state
4. **Conflict Resolution**: Manual merge UI

### Performance Optimizations
1. **Connection Pooling**: Reuse WebSocket connections
2. **Batch Syncing**: Group operations
3. **Compression**: Reduce bandwidth usage
4. **Smart Sync**: Only sync changed documents

### Security Enhancements
1. **Encryption**: End-to-end for private posts
2. **Authentication**: Secure sync servers
3. **Access Control**: Read/write permissions
4. **Audit Logging**: Track sync operations

### Additional Sources
1. **P2P Mode**: Direct device-to-device
2. **IPFS Storage**: Decentralized backend
3. **S3 Compatible**: Cloud object storage
4. **Git Backend**: Version control integration