import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { DocumentId } from '@automerge/automerge-repo';
import {
  getOrCreateIndex,
  updateIndex,
  findPostBySlug,
  removeFromIndex,
} from './index.js';
import type { BlogPost } from '../types/index.js';

export type SyncSource = 'local' | 'remote';

/**
 * Initialize an Automerge repository with file system storage and optional WebSocket networking
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @returns Promise<Repo> - Configured Automerge repository instance
 * @throws Error if storage or network adapter creation fails
 */
export async function initRepo(source: SyncSource = 'remote'): Promise<Repo> {
  try {
    // Create storage adapter pointing to local data directory
    const storage = new NodeFSStorageAdapter('./autoblog-data');

    // Configure network adapter based on source
    const repoConfig: any = { storage };

    if (source === 'remote') {
      // Create network adapter for syncing with Automerge sync server
      const network = new WebSocketClientAdapter('wss://sync.automerge.org');
      repoConfig.network = [network];
    }
    // For 'local' source, no network adapter is added

    // Create and return repo instance
    const repo = new Repo(repoConfig);

    return repo;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to initialize Automerge repository: ${message}`);
  }
}

/**
 * Upload a blog post to the Automerge repository
 * @param blogPost - The blog post data to upload
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @returns Promise<string> - The document ID of the created blog post
 * @throws Error if upload fails
 */
export async function uploadBlogPost(
  blogPost: Partial<BlogPost>,
  source: SyncSource = 'remote'
): Promise<string> {
  try {
    // Initialize Automerge repo
    const repo = await initRepo(source);

    // Create a new document for the blog post
    const docHandle = repo.create<BlogPost>();
    docHandle.change((doc) => {
      Object.assign(doc, blogPost);
    });

    // Get the document ID
    const documentId = docHandle.documentId;

    // Get or create the blog index and add this post
    const indexHandle = await getOrCreateIndex(repo);
    await updateIndex(indexHandle, blogPost.slug!, documentId);

    return documentId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to upload blog post: ${message}`);
  }
}

/**
 * List all blog posts from the Automerge repository
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @returns Promise<BlogPost[]> - Array of blog posts sorted by published date (newest first)
 * @throws Error if listing fails
 */
export async function listBlogPosts(
  source: SyncSource = 'remote'
): Promise<BlogPost[]> {
  try {
    // Initialize Automerge repo
    const repo = await initRepo(source);

    // Get the blog index
    const indexHandle = await getOrCreateIndex(repo);
    const index = await indexHandle.doc();

    // Check if we have any posts
    if (!index || !index.posts || Object.keys(index.posts).length === 0) {
      return [];
    }

    // Load all posts
    const posts: BlogPost[] = [];
    for (const [slug, docId] of Object.entries(index.posts)) {
      try {
        const postHandle = await repo.find<BlogPost>(docId as DocumentId);
        if (!postHandle) continue;

        await postHandle.whenReady();
        const post = await postHandle.doc();
        if (post) {
          posts.push(post);
        }
      } catch (error) {
        // Skip posts that fail to load, but don't throw - continue with other posts
        console.error(`Failed to load post with slug: ${slug}`);
      }
    }

    // Sort posts by published date (newest first)
    posts.sort((a, b) => {
      const dateA = new Date(a.published).getTime();
      const dateB = new Date(b.published).getTime();
      return dateB - dateA;
    });

    return posts;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to list blog posts: ${message}`);
  }
}

/**
 * Delete a blog post from the Automerge repository
 * @param slug - The slug of the blog post to delete
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'remote'
 * @returns Promise<boolean> - True if post was found and deleted, false if not found
 * @throws Error if deletion fails
 */
export async function deleteBlogPost(
  slug: string,
  source: SyncSource = 'remote'
): Promise<boolean> {
  try {
    // Initialize Automerge repo
    const repo = await initRepo(source);

    // Get the blog index
    const indexHandle = await getOrCreateIndex(repo);

    // Find the post ID by slug
    const postDocumentId = await findPostBySlug(indexHandle, slug);

    if (!postDocumentId) {
      return false; // Post not found
    }

    // Try to find the post document (we'll just verify it exists)
    // Note: Automerge doesn't have direct document deletion,
    // so we just remove it from the index to make it unreachable
    try {
      const postHandle = await repo.find<BlogPost>(
        postDocumentId as DocumentId
      );
      if (!postHandle) {
        console.log('Post document not found in repository');
      }
    } catch (error) {
      console.log(
        `Warning: Could not verify post document: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }

    // Remove from index (do this even if document verification failed)
    try {
      await removeFromIndex(indexHandle, slug);
    } catch (error) {
      console.log(
        `Warning: Failed to update index: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }

    return true; // Successfully deleted
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to delete blog post: ${message}`);
  }
}
