import { Repo, DocHandle, DocumentId } from '@automerge/automerge-repo'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { handleError } from '../utils/errorHandling'
import type { BlogPost, BlogIndex } from '../types'

export type SyncSource = 'local' | 'remote'

const DEFAULT_SYNC_URL = 'wss://sync.automerge.org'
const INDEX_ID_KEY = 'autoblog-index-id'

let repoInstance: Repo | null = null

/**
 * Initialize an Automerge repository with IndexedDB storage and optional WebSocket networking
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @param syncUrl - WebSocket URL for sync server, defaults to Automerge public server
 * @returns Promise<Repo> - Configured Automerge repository instance
 * @throws Error if storage or network adapter creation fails
 */
export async function initRepo(
  source: SyncSource = 'remote',
  syncUrl: string = DEFAULT_SYNC_URL
): Promise<Repo> {
  try {
    // Return existing instance if available
    if (repoInstance) {
      return repoInstance
    }

    // Create storage adapter using IndexedDB
    const storage = new IndexedDBStorageAdapter('autoblog-web')

    // Configure network adapter based on source
    const repoConfig: { storage: IndexedDBStorageAdapter; network?: BrowserWebSocketClientAdapter[] } = { storage }

    if (source === 'remote') {
      // Create network adapter for syncing with Automerge sync server
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
  // Try to load existing index document ID from localStorage
  let indexDocumentId: string | null = null

  try {
    indexDocumentId = localStorage.getItem(INDEX_ID_KEY)
  } catch (error) {
    // localStorage not available or other error
  }

  // If we have an existing index ID, try to find it
  if (indexDocumentId) {
    try {
      const existingHandle = await repo.find<BlogIndex>(
        indexDocumentId as DocumentId
      )
      if (existingHandle) {
        await existingHandle.whenReady()
        return existingHandle
      }
    } catch (error) {
      // Index document not found or corrupted, create a new one
    }
  }

  // Create a new index document
  const handle = repo.create<BlogIndex>()
  handle.change((doc) => {
    doc.posts = {}
    doc.lastUpdated = new Date()
  })

  // Save the document ID for future use
  try {
    localStorage.setItem(INDEX_ID_KEY, handle.documentId)
  } catch (error) {
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
  return doc?.posts[slug] || null
}

/**
 * Get all blog posts from the repository
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @param syncUrl - WebSocket URL for sync server
 * @returns Promise<BlogPost[]> - Array of blog posts sorted by published date (newest first)
 * @throws Error if listing fails
 */
export async function getAllBlogPosts(
  source: SyncSource = 'remote',
  syncUrl: string = DEFAULT_SYNC_URL
): Promise<BlogPost[]> {
  try {
    // Initialize Automerge repo
    const repo = await initRepo(source, syncUrl)

    // Get the blog index
    const indexHandle = await getOrCreateIndex(repo)
    const index = await indexHandle.doc()

    // Check if we have any posts
    if (!index || !index.posts || Object.keys(index.posts).length === 0) {
      return []
    }

    // Load all posts
    const posts: BlogPost[] = []
    for (const [slug, docId] of Object.entries(index.posts)) {
      try {
        const postHandle = await repo.find<BlogPost>(docId as DocumentId)
        if (!postHandle) continue

        await postHandle.whenReady()
        const post = await postHandle.doc()
        if (post) {
          posts.push(post)
        }
      } catch (error) {
        // Skip posts that fail to load, but don't throw - continue with other posts
        // eslint-disable-next-line no-console
        console.error(`Failed to load post with slug: ${slug}`)
      }
    }

    // Sort posts by published date (newest first)
    posts.sort((a, b) => {
      const dateA = new Date(a.published).getTime()
      const dateB = new Date(b.published).getTime()
      return dateB - dateA
    })

    return posts
  } catch (error) {
    throw handleError(error, 'Failed to get blog posts')
  }
}

/**
 * Get a single blog post by its slug
 * @param slug - The slug of the blog post to retrieve
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @param syncUrl - WebSocket URL for sync server
 * @returns Promise<BlogPost | null> - The blog post if found, null otherwise
 * @throws Error if retrieval fails
 */
export async function getBlogPostBySlug(
  slug: string,
  source: SyncSource = 'remote',
  syncUrl: string = DEFAULT_SYNC_URL
): Promise<BlogPost | null> {
  try {
    // Initialize Automerge repo
    const repo = await initRepo(source, syncUrl)

    // Get the blog index
    const indexHandle = await getOrCreateIndex(repo)

    // Find the post ID by slug
    const postDocumentId = await findPostBySlug(indexHandle, slug)

    if (!postDocumentId) {
      return null // Post not found
    }

    // Get the post document
    const postHandle = await repo.find<BlogPost>(postDocumentId as DocumentId)
    if (!postHandle) {
      return null
    }

    await postHandle.whenReady()
    const post = await postHandle.doc()

    return post || null
  } catch (error) {
    throw handleError(error, 'Failed to get blog post')
  }
}

/**
 * Get a blog post by its document ID
 * @param documentId - The document ID of the blog post
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @param syncUrl - WebSocket URL for sync server
 * @returns Promise<BlogPost | null> - The blog post if found, null otherwise
 * @throws Error if retrieval fails
 */
export async function getBlogPostById(
  documentId: string,
  source: SyncSource = 'remote',
  syncUrl: string = DEFAULT_SYNC_URL
): Promise<BlogPost | null> {
  try {
    // Initialize Automerge repo
    const repo = await initRepo(source, syncUrl)

    // Get the post document
    const postHandle = await repo.find<BlogPost>(documentId as DocumentId)
    if (!postHandle) {
      return null
    }

    await postHandle.whenReady()
    const post = await postHandle.doc()

    return post || null
  } catch (error) {
    throw handleError(error, 'Failed to get blog post by ID')
  }
}

/**
 * Get the blog index
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @param syncUrl - WebSocket URL for sync server
 * @returns Promise<BlogIndex | null> - The blog index if available, null otherwise
 * @throws Error if retrieval fails
 */
export async function getBlogIndex(
  source: SyncSource = 'remote',
  syncUrl: string = DEFAULT_SYNC_URL
): Promise<BlogIndex | null> {
  try {
    // Initialize Automerge repo
    const repo = await initRepo(source, syncUrl)

    // Get the blog index
    const indexHandle = await getOrCreateIndex(repo)
    const index = await indexHandle.doc()

    return index || null
  } catch (error) {
    throw handleError(error, 'Failed to get blog index')
  }
}

/**
 * Get connection status for the repository
 * @returns Promise<boolean> - True if connected, false otherwise
 */
export async function getConnectionStatus(): Promise<boolean> {
  try {
    if (!repoInstance) {
      return false
    }

    // For now, we'll consider connected if we have a repo instance
    // In a real implementation, you might want to check actual connection state
    return true
  } catch (error) {
    return false
  }
}

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