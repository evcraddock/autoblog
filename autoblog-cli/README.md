# Autoblog CLI

[![CLI CI](https://github.com/evcraddock/autoblog/actions/workflows/cli-ci.yml/badge.svg)](https://github.com/evcraddock/autoblog/actions/workflows/cli-ci.yml)

A command-line interface for managing markdown files in the Automerge-powered blog platform.

## Description

Autoblog CLI allows authors to upload markdown files to a local-first blog system built on Automerge 2.0. It parses markdown files with frontmatter, creates Automerge documents, and syncs them across devices using CRDT technology.

The CLI uses both local storage and the local Automerge sync server for reliable local-first operation with cross-device synchronization. The CLI supports flexible configuration through config files, environment variables, and command-line options.

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/evcraddock/autoblog.git
cd autoblog/autoblog-cli

# Install dependencies
npm install

# Build the project
npm run build
```

### Global Installation

After building from source:

```bash
# Install globally on your system
npm install -g .

# Verify installation
autoblog --help
```

## Configuration

Autoblog CLI supports flexible configuration through multiple methods with clear precedence:

1. **Default values** (hardcoded fallbacks)
2. **Global config file** (OS-appropriate location)
3. **Project config file** (`.autoblog/config.json` in current directory)
4. **Environment variables** (`AUTOBLOG_*` prefix)
5. **Command-line arguments** (highest priority)

### Configuration File Locations

- **macOS/Linux**: `~/.config/autoblog/config.json`
- **Windows**: `%APPDATA%/autoblog/config.json`
- **Project-specific**: `.autoblog/config.json` (takes precedence over global)

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
  }
}
```

### Data Directory Locations

- **macOS**: `~/Library/Application Support/autoblog/`
- **Linux**: `~/.local/share/autoblog/` (or `$XDG_DATA_HOME/autoblog/`)
- **Windows**: `%APPDATA%/autoblog/data/`
- **Project-specific**: `.autoblog/data/` (when using project config)

### Configuration Management Commands

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

## Usage

### Configuration Overrides

All commands support configuration override options:

- `--sync-url <url>`: Override sync URL for this command
- `--data-path <path>`: Override data path for this command

### Upload a Blog Post

```bash
# Upload a markdown file (uses both local storage and remote sync)
autoblog upload post.md

# Override sync URL for this command
autoblog upload post.md --sync-url wss://custom.sync.server

# Override data path for this command
autoblog upload post.md --data-path ~/my-blog-data

# Or using npm scripts
npm run start upload post.md
```

### List All Blog Posts

```bash
# List all posts (from both local storage and remote sync)
autoblog list

# Override sync URL for this command
autoblog list --sync-url wss://custom.sync.server

# Override data path for this command
autoblog list --data-path ~/my-blog-data

# Or using npm scripts
npm run start list
```

### Delete a Blog Post

```bash
# Delete a post by its slug (removes from both local storage and remote sync)
autoblog delete <slug>

# Override sync URL for this command
autoblog delete <slug> --sync-url wss://custom.sync.server

# Override data path for this command
autoblog delete <slug> --data-path ~/my-blog-data

# Or using npm scripts
npm run start delete <slug>

# Example
autoblog delete my-post-slug
```

### Show Help

```bash
# Display available commands
autoblog --help

# Or
npm run start -- --help
```

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/evcraddock/autoblog.git
   cd autoblog/autoblog-cli
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run in development mode**

   ```bash
   npm run dev -- upload test-post.md
   ```

4. **Run tests**

   ```bash
   # Run all tests
   npm test

   # Run tests in watch mode
   npm run test:watch

   # Run tests with UI
   npm run test:ui
   ```

## Testing

The project uses Vitest for testing with comprehensive coverage:

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode for development
npm run test:watch

# Run tests with coverage report
npm test -- --coverage

# Open interactive test UI
npm run test:ui
```

### Git Hooks

Pre-commit hooks are configured to automatically:

- Run tests on changed files
- Validate TypeScript compilation
- Format code with Prettier

These hooks ensure code quality before any commit is made.

### Test Structure

- **Unit Tests**: Located in `tests/unit/`, testing individual modules
- **Test Fixtures**: Sample markdown files in `tests/fixtures/`

## Markdown File Format

Blog posts should be markdown files with frontmatter:

```markdown
---
title: My First Blog Post
author: Jane Doe
published: 2024-01-15
status: published
description: A brief description of the post
imageUrl: https://example.com/image.jpg
---

# Content goes here

Your blog post content in markdown format...
```

### Required Fields

- `title`: The post title
- `author`: Author name

### Optional Fields

- `published`: Publication date (defaults to current date)
- `status`: Either "draft" or "published" (defaults to "draft")
- `description`: Brief post description
- `imageUrl`: Featured image URL

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass (`npm test`)
4. Submit a pull request

## Links

- [Main Project Documentation](../README.md)
- [Architecture Overview](../docs/architecture.md)
- [GitHub Repository](https://github.com/evcraddock/autoblog)

## License

MIT
