# CLI Configuration Management

## Overview

The autoblog-cli configuration management system provides flexible, OS-appropriate configuration handling for the command-line interface. It follows the XDG Base Directory Specification and supports multiple configuration methods with clear precedence rules.

## Configuration System Architecture

### Configuration Loading Priority

The configuration system loads and merges settings from multiple sources in the following order of precedence:

1. **Default values** (hardcoded fallbacks)
2. **Global config file** (OS-appropriate location)
3. **Project config file** (`.autoblog/config.json` in current directory)
4. **Environment variables** (`AUTOBLOG_*` prefix)
5. **Command-line arguments** (highest priority)

### Automatic Configuration Creation

When no configuration file exists at the global location, the system automatically creates one with default values on first use. This ensures users always have a complete, valid configuration file to reference and modify.

## Configuration File Locations

### Global Configuration

Configuration files are stored in OS-appropriate locations following platform conventions:

- **macOS/Linux**: `~/.config/autoblog/config.json`
- **Windows**: `%APPDATA%/autoblog/config.json`

### Project-Specific Configuration

Projects can override global settings by creating a local configuration file:

- **All platforms**: `.autoblog/config.json` (in current directory)

When a project config exists, it takes precedence over the global config but is merged with defaults and can still be overridden by environment variables and CLI arguments.

## Data Directory Locations

The system uses OS-appropriate data directories for storing blog data:

- **macOS**: `~/Library/Application Support/autoblog/`
- **Linux**: `~/.local/share/autoblog/` (or `$XDG_DATA_HOME/autoblog/`)
- **Windows**: `%APPDATA%/autoblog/data/`
- **Project-specific**: `.autoblog/data/` (when using project config)

## Configuration Schema

The complete configuration schema with default values:

```json
{
  "network": {
    "syncUrl": "wss://sync.automerge.org",
    "timeout": 30000
  },
  "storage": {
    "dataPath": "/path/to/os/appropriate/data/dir",
    "indexIdFile": "index-id.txt"
  },
  "sync": {
    "defaultSource": "all"
  }
}
```

### Configuration Options

#### Network Configuration

- **`syncUrl`** (string): WebSocket URL for Automerge CRDT synchronization
  - Default: `"wss://sync.automerge.org"`
  - Purpose: Remote synchronization server endpoint

- **`timeout`** (number): Network timeout in milliseconds
  - Default: `30000` (30 seconds)
  - Purpose: Connection timeout for sync operations

#### Storage Configuration

- **`dataPath`** (string): Directory for local data storage
  - Default: OS-appropriate data directory
  - Purpose: Location for NodeFS storage adapter and blog data

- **`indexIdFile`** (string): Filename for storing blog index document ID
  - Default: `"index-id.txt"`
  - Purpose: Relative path within dataPath for index tracking

#### Sync Configuration

- **`defaultSource`** (string): Default synchronization behavior
  - Default: `"all"`
  - Options: `"local"`, `"remote"`, `"all"`
  - Purpose: Controls whether operations sync locally, remotely, or both

## Environment Variables

All configuration values can be overridden using environment variables with the `AUTOBLOG_` prefix:

```bash
# Network configuration
export AUTOBLOG_SYNC_URL="wss://custom.sync.server"
export AUTOBLOG_TIMEOUT=60000

# Storage configuration
export AUTOBLOG_DATA_PATH="~/my-blog-data"

# Sync configuration
export AUTOBLOG_SYNC_SOURCE="local"
```

Environment variables take precedence over both global and project configuration files.

## Command-Line Configuration Overrides

All main commands support configuration override options:

```bash
# Override sync URL for a single command
autoblog upload post.md --sync-url wss://custom.sync.server

# Override data path for a single command
autoblog list --data-path ~/my-blog-data

# Use different sync source
autoblog upload post.md --sync-source local
```

Command-line arguments have the highest precedence and override all other configuration sources.

## Configuration Management Commands

The `autoblog config` command provides tools for managing configuration:

### View Configuration

```bash
# Display complete current configuration
autoblog config list

# Show configuration file and data directory paths
autoblog config path
```

### Get Configuration Values

```bash
# Get specific configuration value
autoblog config get network.syncUrl
autoblog config get storage.dataPath
autoblog config get sync.defaultSource
```

### Set Configuration Values

```bash
# Set network configuration
autoblog config set network.syncUrl wss://custom.sync.server
autoblog config set network.timeout 60000

# Set storage configuration
autoblog config set storage.dataPath ~/my-blog-data

# Set sync configuration
autoblog config set sync.defaultSource local
```

### Reset Configuration

```bash
# Reset entire configuration to defaults
autoblog config reset

# Reset specific configuration key
autoblog config reset network.syncUrl
```

## Usage Examples

### Global Configuration Setup

```bash
# Set up custom sync server globally
autoblog config set network.syncUrl wss://my-company.sync.server
autoblog config set storage.dataPath ~/company-blog-data

# View current settings
autoblog config list
```

### Project-Specific Configuration

```bash
# Create project-specific config
mkdir .autoblog
echo '{
  "network": {
    "syncUrl": "wss://project.sync.server"
  },
  "storage": {
    "dataPath": "./project-data"
  }
}' > .autoblog/config.json

# Commands now use project config
autoblog config list  # Shows project config merged with defaults
```

### Environment-Based Configuration

```bash
# Use environment for CI/CD or development
export AUTOBLOG_SYNC_URL="wss://staging.sync.server"
export AUTOBLOG_DATA_PATH="/tmp/test-blog-data"

# All commands use environment settings
autoblog upload test-post.md
```

### Command-Specific Overrides

```bash
# One-off commands with custom settings
autoblog upload post.md \
  --sync-url wss://custom.server \
  --data-path /tmp/temp-data \
  --sync-source local
```

## Configuration Validation

The system validates configuration values:

- **sync.defaultSource**: Must be `"local"`, `"remote"`, or `"all"`
- **network.timeout**: Must be a positive number
- **network.syncUrl**: Must be a valid WebSocket URL format
- **storage.dataPath**: Must be a valid filesystem path
- **storage.indexIdFile**: Must be a valid filename

Invalid configuration values will result in clear error messages with guidance on correct values.

## Security Considerations

- Configuration files are created with appropriate permissions (600 on Unix systems)
- Sensitive values are not logged in error messages
- Environment variables are validated and sanitized
- Configuration parsing handles malformed JSON gracefully
- No sensitive data is stored in configuration files by default

## Troubleshooting

### Common Issues

**Configuration not taking effect:**
- Check precedence order: CLI args > env vars > project config > global config > defaults
- Verify file exists at expected location: `autoblog config path`
- Validate JSON syntax in configuration files

**Permission errors:**
- Ensure write permissions to config directory
- Check that data directory is writable
- Verify appropriate file permissions on existing config files

**Path resolution issues:**
- Use absolute paths when in doubt
- Check that `~` expansion works in your environment
- Verify environment variables are properly set

### Debug Commands

```bash
# Check current configuration and paths
autoblog config path
autoblog config list

# Test with environment overrides
AUTOBLOG_SYNC_URL=test autoblog config get network.syncUrl

# Verify command-line overrides
autoblog config list --data-path /tmp/test
```

This configuration system provides a robust, flexible foundation for autoblog-cli while following established patterns for desktop command-line applications.