# CLI Sync Source Support - DEPRECATED

## Status: REMOVED

**This feature has been removed as of the latest version.** The CLI now always uses both local storage and remote synchronization without configuration options.

## Summary of Changes

The sync source support system that allowed users to choose between 'local', 'remote', or 'all' synchronization modes has been simplified. The CLI now:

- **Always uses NodeFSStorageAdapter** for local filesystem storage
- **Always uses WebSocketClientAdapter** for remote synchronization to `wss://sync_server`
- **Removed the `--source` CLI option** from all commands
- **Removed the `sync.defaultSource` configuration** option

## Migration Guide

### Before (Deprecated)
```bash
# These commands no longer work
autoblog upload post.md --source local
autoblog upload post.md --source remote  
autoblog upload post.md --source all
```

### After (Current)
```bash
# This is now the only way to use the CLI
autoblog upload post.md  # Uses both local storage and remote sync
```

## Benefits of Simplification

1. **Reduced Complexity**: No conditional logic for different sync modes
2. **Better Reliability**: Local storage ensures data persistence even during network issues
3. **Consistent Behavior**: All users get the same reliable local-first experience
4. **Simplified Configuration**: Fewer options to configure and maintain

## Architecture

The CLI now always initializes both adapters:

```typescript
const repoConfig = {
  storage: new NodeFSStorageAdapter(dataPath),
  network: [new WebSocketClientAdapter(syncUrl)]
};
```

This provides a robust local-first architecture with automatic cloud synchronization for cross-device access.

## See Also

- [CLI Configuration Management](./cli-configuration-management.md) - Updated configuration options
- [CLI Upload Command](./cli-upload-command.md) - Updated command usage
- [CLI List Command](./cli-list-command.md) - Updated command usage
- [CLI Delete Command](./cli-delete-command.md) - Updated command usage