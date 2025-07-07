# Autoblog Project

## What This Project Does

Autoblog is a local-first blog platform built on Automerge 2.0 CRDT (Conflict-free Replicated Data Types). It allows authors to write and publish blog posts using markdown files while providing real-time synchronization capabilities across different devices and applications.

## Architecture Overview

The project consists of two main components:

1. **CLI Tool** (`autoblog-cli/`): A command-line interface for authors to upload markdown files to the blog system
2. **Web Viewer** (planned): A public-facing website for reading blog posts

## How It Works

### Data Flow
1. Author writes markdown files locally with frontmatter metadata
2. CLI tool parses markdown files and extracts frontmatter (title, author, publish date, etc.)
3. Content is stored as Automerge documents with local NodeFS storage
4. Documents sync to Automerge's public sync server (`wss://sync.automerge.org`)
5. Multiple clients can sync the same documents for collaborative editing

### Key Technologies
- **Automerge 2.0**: Provides CRDT-based document synchronization
- **TypeScript**: Type-safe development
- **Gray-matter**: Frontmatter parsing from markdown files
- **Commander.js**: CLI framework
- **Vitest**: Testing framework

### Current CLI Commands
- `autoblog upload <file.md>`: Upload a markdown file to the blog system

### Document Structure
- **BlogPost**: Contains title, author, published date, status, slug, description, content, and optional image URL
- **BlogIndex**: Maps slugs to document IDs for efficient post discovery

### Storage
- Local storage: `./autoblog-data/` directory using NodeFS adapter
- Remote sync: Automerge's public sync server for cross-device synchronization

## Development Status
Currently in MVP phase with basic CLI upload functionality. The web viewer component is planned but not yet implemented.

## Team Workflow

- Assign pull requests to evcraddock
- Before starting the next prompt ensure that the current git branch is pushed and pull latest from the main branch.