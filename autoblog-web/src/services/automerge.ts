import { Repo, DocHandle, DocumentId } from '@automerge/automerge-repo'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { handleError } from '../utils/errorHandling'
import type { BlogIndex } from '../types'
import { config } from '../config'

export type SyncSource = 'local' | 'remote' | 'all'

const INDEX_ID_KEY = 'autoblog-index-id'

let repoInstance: Repo | null = null

/**
 * Initialize an Automerge repository with IndexedDB storage and optional WebSocket networking
 * @param source - The sync source to use ('local', 'remote', or 'all'), defaults to 'remote'
 * @param syncUrl - WebSocket URL for sync server, defaults to Automerge public server
 * @returns Promise<Repo> - Configured Automerge repository instance
 * @throws Error if storage or network adapter creation fails
 */
export async function initRepo(
  source: SyncSource = 'remote',
  syncUrl: string = config.syncUrl
): Promise<Repo> {
  try {
    // Return existing instance if available
    if (repoInstance) {
      return repoInstance
    }

    // Always use IndexedDB storage for the web app
    const storage = new IndexedDBStorageAdapter(config.databaseName)

    // Configure network adapter based on source
    const repoConfig: {
      storage: IndexedDBStorageAdapter
      network?: BrowserWebSocketClientAdapter[]
    } = { storage }

    // Add network adapter for remote sync (default behavior)
    if (source === 'remote' || source === 'all') {
      const network = new BrowserWebSocketClientAdapter(syncUrl)
      repoConfig.network = [network]
    }
    // For 'local' source, no network adapter is added

    // Create and cache repo instance
    repoInstance = new Repo(repoConfig)

    return repoInstance
  } catch (error) {
    throw handleError(error, 'Failed to initialize Automerge repository')
  }
}

/**
 * Get or create the blog index document
 * @param repo - The Automerge repository instance
 * @returns Promise<DocHandle<BlogIndex>> - Handle to the blog index document
 */
export async function getOrCreateIndex(
  repo: Repo
): Promise<DocHandle<BlogIndex>> {
  // First try to use the CLI's index document ID
  try {
    const existingHandle = await repo.find<BlogIndex>(
      config.cliIndexId as DocumentId
    )
    if (existingHandle) {
      await existingHandle.whenReady()
      // Save to localStorage for future reference
      try {
        localStorage.setItem(INDEX_ID_KEY, config.cliIndexId)
      } catch {
        // localStorage not available, continue anyway
      }
      return existingHandle
    }
  } catch {
    // CLI index document not found, try localStorage fallback
  }

  // Fallback: Try to load existing index document ID from localStorage
  let indexDocumentId: string | null = null

  try {
    indexDocumentId = localStorage.getItem(INDEX_ID_KEY)
  } catch {
    // localStorage not available or other error
  }

  // If we have an existing index ID, try to find it
  if (indexDocumentId && indexDocumentId !== config.cliIndexId) {
    try {
      const existingHandle = await repo.find<BlogIndex>(
        indexDocumentId as DocumentId
      )
      if (existingHandle) {
        await existingHandle.whenReady()
        return existingHandle
      }
    } catch {
      // Index document not found or corrupted, create a new one
    }
  }

  // Create a new index document
  const handle = repo.create<BlogIndex>()
  handle.change(doc => {
    doc.posts = {}
    doc.lastUpdated = new Date()
  })

  // Save the document ID for future use
  try {
    localStorage.setItem(INDEX_ID_KEY, handle.documentId)
  } catch {
    // eslint-disable-next-line no-console
    console.warn('Warning: Could not save index document ID to localStorage')
  }

  return handle
}

/**
 * Find a blog post by its slug
 * @param handle - The blog index document handle
 * @param slug - The slug to search for
 * @returns Promise<string | null> - The document ID if found, null otherwise
 */
export async function findPostBySlug(
  handle: DocHandle<BlogIndex>,
  slug: string
): Promise<string | null> {
  const doc = await handle.doc()
  return doc?.posts?.[slug] || null
}

// These functions are now handled by the official React hooks
// Keeping only the core repo management functions

/**
 * Cleanup and close the repository
 */
export async function cleanup(): Promise<void> {
  if (repoInstance) {
    try {
      // Close any open connections
      // Note: Automerge repo doesn't have a shutdown method in current version
      // We'll just clear the instance
      repoInstance = null
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Warning: Error during repository cleanup:', error)
    } finally {
      repoInstance = null
    }
  }
}
