import fs from 'fs/promises';
import path from 'path';
import { Repo, DocHandle, DocumentId } from '@automerge/automerge-repo';
import type { BlogIndex } from '../types/index.js';
import { getConfigManager } from './config.js';
import type { CliConfig } from '../types/config.js';

export async function getOrCreateIndex(
  repo: Repo,
  overrides?: Partial<CliConfig>
): Promise<DocHandle<BlogIndex>> {
  // Load configuration
  const configManager = getConfigManager();
  const config = await configManager.loadConfig();
  const finalConfig = overrides
    ? {
        ...config,
        storage: { ...config.storage, ...overrides.storage },
      }
    : config;

  // Build path to index ID file
  const indexIdFile = path.join(
    finalConfig.storage.dataPath,
    finalConfig.storage.indexIdFile
  );

  // Try to load existing index document ID
  let indexDocumentId: string | null = null;

  try {
    indexDocumentId = await fs.readFile(indexIdFile, 'utf-8');
    indexDocumentId = indexDocumentId.trim();
  } catch (error) {
    // File doesn't exist, we'll create a new index
  }

  // If we have an existing index ID, try to find it
  if (indexDocumentId) {
    try {
      const existingHandle = await repo.find<BlogIndex>(
        indexDocumentId as DocumentId
      );
      if (existingHandle) {
        await existingHandle.whenReady();
        return existingHandle;
      }
    } catch (error) {
      // Index document not found or corrupted, create a new one
    }
  }

  // Create a new index document
  const handle = repo.create<BlogIndex>();
  handle.change((doc) => {
    doc.posts = {};
    doc.lastUpdated = new Date();
  });

  // Save the document ID for future use
  try {
    await fs.mkdir(path.dirname(indexIdFile), { recursive: true });
    await fs.writeFile(indexIdFile, handle.documentId);
  } catch (error) {
    console.warn('Warning: Could not save index document ID to file');
  }

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
