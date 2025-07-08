# CLI Configuration Management

## Overview

This document outlines the configuration management system for autoblog-cli, a desktop command-line application that requires filesystem-based configuration following OS conventions.

## Current Configuration Analysis

### Runtime Configuration Values

The CLI application currently uses hardcoded values that need to be configurable:

#### Network Configuration
- **WebSocket Sync URL**: `wss://sync.automerge.org`
- **Purpose**: Automerge CRDT synchronization server
- **Current**: Hardcoded in `autoblog-cli/src/lib/automerge.ts:34`

#### Storage Configuration
- **Local Storage Path**: `./autoblog-data`
- **Purpose**: Directory for NodeFS storage adapter
- **Current**: Hardcoded in `autoblog-cli/src/lib/automerge.ts:28`
- **Proposed**: OS-appropriate data directory locations

- **Index ID File**: `./autoblog-data/index-id.txt`
- **Purpose**: Stores the blog index document ID
- **Current**: Hardcoded in `autoblog-cli/src/lib/index.ts:7`
- **Proposed**: Relative to data directory location

#### Synchronization Configuration
- **Default Sync Source**: `all` (local + remote)
- **Purpose**: Determines sync behavior (local, remote, or both)
- **Current**: Default parameter in function signatures

## Proposed Configuration System

As a desktop CLI application, autoblog-cli should use filesystem-based configuration following OS conventions and the XDG Base Directory Specification.

### Configuration File Locations

Following XDG Base Directory Specification and OS conventions:

- **Linux/macOS**: `~/.config/autoblog/config.json`
- **Windows**: `%APPDATA%/autoblog/config.json`
- **Project-specific**: `.autoblog/config.json` (in current directory)

### Data Directory Locations

Following XDG Base Directory Specification and OS conventions:

- **Linux**: `~/.local/share/autoblog/` or `$XDG_DATA_HOME/autoblog/`
- **macOS**: `~/Library/Application Support/autoblog/`
- **Windows**: `%APPDATA%/autoblog/data/`
- **Project-specific**: `.autoblog/data/` (in current directory)

### Configuration Loading Priority

1. **Default values** (hardcoded fallbacks)
2. **Global config file** (`~/.config/autoblog/config.json`)
3. **Project config file** (`.autoblog/config.json`)
4. **Environment variables** (`AUTOBLOG_*`)
5. **Command-line arguments** (highest priority)

### Configuration Schema

```json
{
  "network": {
    "syncUrl": "wss://sync.automerge.org",
    "timeout": 30000
  },
  "storage": {
    "dataPath": "~/.local/share/autoblog",
    "indexIdFile": "index-id.txt"
  },
  "sync": {
    "defaultSource": "all"
  }
}
```

**Note**: The `dataPath` will be resolved to the appropriate OS-specific location:
- **Linux**: `~/.local/share/autoblog/` (or `$XDG_DATA_HOME/autoblog/`)
- **macOS**: `~/Library/Application Support/autoblog/`
- **Windows**: `%APPDATA%/autoblog/data/`
- **Project-specific**: `.autoblog/data/` (when using project config)

The `indexIdFile` is relative to the `dataPath` directory.

### Environment Variables

```bash
AUTOBLOG_SYNC_URL=wss://sync.automerge.org
AUTOBLOG_DATA_PATH=~/.local/share/autoblog
AUTOBLOG_SYNC_SOURCE=all
AUTOBLOG_TIMEOUT=30000
```

**Note**: The `AUTOBLOG_DATA_PATH` can be set to any valid path. If not specified, the application will use the OS-appropriate default location.

### Command-line Arguments

```bash
# Override sync URL for a single command
autoblog upload post.md --sync-url wss://custom.sync.server

# Use only local storage (no network sync)
autoblog list --sync-source local

# Use only remote sync (no local storage)
autoblog upload post.md --sync-source remote

# Configure settings
autoblog config set network.syncUrl wss://custom.sync.server
autoblog config get network.syncUrl
autoblog config list
```

### Configuration Management Commands

Add a `config` subcommand to manage configuration:

```bash
# View current configuration
autoblog config list

# Get specific value
autoblog config get network.syncUrl

# Set configuration value
autoblog config set network.syncUrl wss://custom.sync.server
autoblog config set storage.dataPath ~/my-blog-data

# Reset to defaults
autoblog config reset
autoblog config reset network.syncUrl

# Show configuration file location
autoblog config path
```

## Implementation Strategy

### Phase 1: Configuration Loading Infrastructure
1. Implement XDG-compliant config file discovery
2. Add JSON configuration file parsing with validation
3. Create configuration merging logic (defaults → global → project → env → cli)
4. Add TypeScript interfaces for type safety

### Phase 2: Environment and CLI Integration
1. Add environment variable support with `AUTOBLOG_*` prefix
2. Extend command-line argument parsing for configuration overrides
3. Add configuration validation and helpful error messages
4. Implement configuration file creation and initialization

### Phase 3: Configuration Management Commands
1. Add `autoblog config` subcommand with get/set/list operations
2. Implement configuration file creation and editing
3. Add configuration validation and migration tools
4. Create configuration documentation and examples

### TypeScript Configuration Interface

```typescript
interface CliConfig {
  network: {
    syncUrl: string
    timeout: number
  }
  storage: {
    dataPath: string  // OS-appropriate data directory path
    indexIdFile: string  // Relative to dataPath
  }
  sync: {
    defaultSource: 'local' | 'remote' | 'all'
  }
}

interface ConfigLoader {
  loadConfig(): Promise<CliConfig>
  getConfigPath(): string
  saveConfig(config: Partial<CliConfig>): Promise<void>
  resetConfig(): Promise<void>
}
```

## Benefits

1. **OS-Appropriate**: Follows platform conventions for configuration storage
2. **Flexible**: Multiple configuration methods (file, env, cli) with clear precedence
3. **User-Friendly**: Simple configuration management through CLI commands
4. **Project-Aware**: Supports both global and project-specific configuration
5. **Backwards Compatible**: Maintains current behavior as defaults

## Migration Strategy

1. **Maintain backwards compatibility** with current hardcoded values as defaults
2. **Implement configuration loading** as optional enhancement
3. **Add validation and error handling** for configuration values
4. **Update documentation** with configuration options and examples
5. **Provide configuration migration tools** for existing users

## Security Considerations

- Configuration files should have appropriate permissions (600 on Unix systems)
- Sensitive configuration values should be masked in logs and error messages
- Environment variables should be validated and sanitized
- Configuration file parsing should be robust against malformed JSON

This configuration system will provide a solid foundation for autoblog-cli while following established patterns for desktop command-line applications.