import { Repo, DocHandle } from '@automerge/automerge-repo';
import type { BlogIndex } from '../types/index.js';

// We'll store the index document ID in a well-known location
// In a real app, this could be stored in config or discovered via other means
const INDEX_HANDLE_KEY = 'autoblog-index-handle';
let indexDocumentId: string | null = null;

export async function getOrCreateIndex(
  repo: Repo
): Promise<DocHandle<BlogIndex>> {
  // For now, always create a new index document
  // In a real implementation, we'd need to persist the index document ID
  // and retrieve it on subsequent runs
  const handle = repo.create<BlogIndex>();
  handle.change((doc) => {
    doc.posts = {};
    doc.lastUpdated = new Date();
  });

  return handle;
}

export async function updateIndex(
  handle: DocHandle<BlogIndex>,
  slug: string,
  docId: string
): Promise<void> {
  await handle.change((doc) => {
    doc.posts[slug] = docId;
    doc.lastUpdated = new Date();
  });
}

export async function removeFromIndex(
  handle: DocHandle<BlogIndex>,
  slug: string
): Promise<void> {
  await handle.change((doc) => {
    delete doc.posts[slug];
    doc.lastUpdated = new Date();
  });
}

export async function findPostBySlug(
  handle: DocHandle<BlogIndex>,
  slug: string
): Promise<string | null> {
  const doc = await handle.doc();
  return doc?.posts[slug] || null;
}
