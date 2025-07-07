# Autoblog CLI

[![CLI CI](https://github.com/evcraddock/autoblog/actions/workflows/cli-ci.yml/badge.svg)](https://github.com/evcraddock/autoblog/actions/workflows/cli-ci.yml)

A command-line interface for managing markdown files in the Automerge-powered blog platform.

## Description

Autoblog CLI allows authors to upload markdown files to a local-first blog system built on Automerge 2.0. It parses markdown files with frontmatter, creates Automerge documents, and syncs them across devices using CRDT technology.

By default, all commands sync with the Automerge sync server at `wss://sync.automerge.org` for cross-device synchronization. You can use the `--source local` option to work with local storage only.

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

## Usage

### Sync Options

All commands support a `--source` option to control where data is stored and synced:

- `--source remote` (default): Syncs with the Automerge sync server at `wss://sync.automerge.org`
- `--source local`: Works with local storage only (no network sync)

### Upload a Blog Post

```bash
# Upload a markdown file (syncs to remote by default)
autoblog upload post.md

# Upload to local storage only
autoblog upload post.md --source local

# Explicitly sync to remote
autoblog upload post.md --source remote

# Or using npm scripts
npm run start upload post.md
```

### List All Blog Posts

```bash
# List all posts (from remote by default)
autoblog list

# List posts from local storage only
autoblog list --source local

# Explicitly list from remote
autoblog list --source remote

# Or using npm scripts
npm run start list
```

### Delete a Blog Post

```bash
# Delete a post by its slug (from remote by default)
autoblog delete <slug>

# Delete from local storage only
autoblog delete <slug> --source local

# Explicitly delete from remote
autoblog delete <slug> --source remote

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

## Project Structure

```
autoblog-cli/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── commands/          # CLI command implementations
│   │   ├── upload.ts      # Upload command
│   │   ├── list.ts        # List command
│   │   └── delete.ts      # Delete command
│   ├── lib/               # Core library modules
│   │   ├── automerge.ts   # Automerge repository setup
│   │   ├── parser.ts      # Markdown parsing utilities
│   │   └── index.ts       # Index management functions
│   └── types/             # TypeScript type definitions
│       └── index.ts       # Shared interfaces
├── tests/
│   ├── unit/              # Unit tests
│   └── fixtures/          # Test data files
├── dist/                  # Compiled JavaScript (generated)
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
└── vitest.config.ts       # Test framework configuration
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
