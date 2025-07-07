# autoblog

[![CLI CI](https://github.com/evcraddock/autoblog/actions/workflows/cli-ci.yml/badge.svg)](https://github.com/evcraddock/autoblog/actions/workflows/cli-ci.yml)
[![Web CI](https://github.com/evcraddock/autoblog/actions/workflows/web-ci.yml/badge.svg)](https://github.com/evcraddock/autoblog/actions/workflows/web-ci.yml)

A local-first blog platform using Automerge 2.0 CRDT for real-time synchronization across devices.

## CLI Usage

The autoblog CLI tool allows you to manage markdown files for your blog:

```bash
# Navigate to the CLI directory
cd autoblog-cli

# Install dependencies
npm install

# Build the CLI
npm run build

# Upload a markdown file (placeholder functionality)
npm run start upload my-post.md
# or
node dist/index.js upload my-post.md

# Show help
npm run start -- --help
# or
node dist/index.js --help
```

## Development

```bash
# Run tests
npm test

# Development mode (requires build first)
npm run dev -- upload test-post.md
```
