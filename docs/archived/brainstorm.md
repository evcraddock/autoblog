# Autoblog Brainstorming Session

## Overview
MVP: A blog that stores its data using Automerge (local-first framework)

## Questions & Answers

### Question 1: What's your primary motivation for using Automerge?
**Answer:** Interested in local-first capabilities and experimenting with the framework. The version control aspects are also very interesting.

### Question 2: What type of content will this blog primarily host?
**Answer:** Mostly personal writing.

### Question 3: How do you envision the writing/editing experience?
**Answer:** Markdown based editing.

### Question 4: What are your thoughts on syncing and storage?
**Answer:** (User asked about storage adapters)

Based on the Automerge documentation, here are the available adapters:

**Storage Adapters:**
- **IndexedDBStorageAdapter** - Browser-based local storage (works offline)
- **NodeFS** - Filesystem storage for Node.js applications
- Custom adapters can be built for any key/value store

**Network Adapters for syncing:**
- **BroadcastChannelNetworkAdapter** - Syncs between browser tabs locally
- **WebSocketClientAdapter** - Syncs across devices via a server (e.g., wss://sync_server)

Given these options, which approach appeals to you for your blog?
1. Pure local with IndexedDB (browser-only, no syncing between devices)
2. Local + WebSocket sync (access your blog from any device)
3. Server-based with NodeFS + WebSocket
4. Something else?

**Answer:** Options 1 and 2 - Start with pure local IndexedDB, then add WebSocket sync capability.

### Question 5: How do you want to handle publishing and readers?
**Answer:** A website that would be read-only for viewers and a command line tool that would run locally for saving articles to the sync source.

### Question 6: What features are essential for your MVP?
**Answer:** Instead of create/edit posts via CLI, upload/save existing markdown files via CLI. 

Must-haves for MVP:
- Upload/save existing markdown files via CLI
- View posts on website  
- Basic markdown rendering
- Post metadata (title, date, author)

### Question 7: How should the CLI tool discover and handle markdown files?
**Answer:** MVP is single file upload - `autoblog upload post.md`

### Question 8: What's your preferred tech stack?
**Answer:** (User asked for suggestions based on Automerge API docs)

Based on Automerge being a JavaScript/TypeScript library, I'd recommend:

**CLI Tool:**
- **Node.js with TypeScript** - Natural fit since Automerge is JS/TS based
- Can directly use Automerge's APIs
- Good filesystem access for reading markdown files
- Can use the NodeFS storage adapter

**Website:**
- **Vanilla JS or lightweight framework** (Vite + vanilla TS)
- Since it's read-only, you don't need heavy framework overhead
- Can use Automerge directly in the browser with IndexedDB
- Simple markdown-to-HTML rendering

This keeps the stack minimal and aligned with Automerge's design. Would you prefer this approach or something different?

**Answer:** That works.

### Question 9: How should we structure the Automerge document schema?
**Answer:** Hybrid approach - index document + individual post documents

Fields for each post:
- title
- author  
- published (date)
- status
- slug
- description
- content (markdown)

### Question 10: Any specific features or constraints to consider?
**Answer:** Need to store either an image or a link to an image. We should be using the latest version of Automerge.

With the latest Automerge (Repo 2.0 as of May 2025), you have these options:

1. **Store image URLs/links** (Still recommended for MVP)
   - Simple string field in the document
   - No size concerns
   - Images hosted elsewhere (CDN, cloud storage)

2. **Store binary data with Uint8Array**
   - Automerge 2.0 has efficient binary format (30% overhead)
   - Can store images directly in the document
   - Good for small images or when offline-first is critical

3. **Use Hyperfiles** (if using Hypermerge)
   - Separate binary storage for images
   - Better for larger files
   - More complex setup

For MVP, I'd still recommend URLs. Which image storage approach fits your needs:
- A single featured image URL per post?
- Support for multiple images?
- Store small images directly as binary?

**Answer:** Use Automerge 2.0 and store URL links to images for the MVP.

## Summary of MVP Architecture

Based on our brainstorming session, here's the planned MVP:

### Core Components:
1. **CLI Tool** (Node.js/TypeScript)
   - Single file upload: `autoblog upload post.md`
   - Reads markdown files from local filesystem
   - Connects to Automerge using NodeFS storage adapter
   - Pushes posts to the Automerge document store

2. **Website** (Vanilla TypeScript + Vite)
   - Read-only viewer for blog posts
   - Uses Automerge with IndexedDB for local caching
   - Renders markdown to HTML
   - Can sync via WebSocket when available

### Data Structure:
- Hybrid approach: Index document + individual post documents
- Post schema:
  ```typescript
  {
    title: string
    author: string
    published: Date
    status: string
    slug: string
    description: string
    content: string // markdown
    imageUrl?: string // optional featured image
  }
  ```

### Storage Strategy:
- Start with IndexedDB (browser-only)
- Add WebSocket sync capability later
- Use Automerge 2.0 for all CRDT operations

Ready to start building? 🚀
