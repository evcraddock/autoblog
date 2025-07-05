import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { DocumentId } from '@automerge/automerge-repo';
import { getOrCreateIndex, updateIndex } from './index.js';
import type { BlogPost } from '../types/index.js';

export type SyncSource = 'local' | 'remote';

/**
 * Initialize an Automerge repository with file system storage and optional WebSocket networking
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'local'
 * @returns Promise<Repo> - Configured Automerge repository instance
 * @throws Error if storage or network adapter creation fails
 */
export async function initRepo(source?: SyncSource): Promise<Repo> {
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
    // For 'local' source or undefined, no network adapter is added

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
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'local'
 * @returns Promise<string> - The document ID of the created blog post
 * @throws Error if upload fails
 */
export async function uploadBlogPost(
  blogPost: Partial<BlogPost>,
  source?: SyncSource
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
 * @param source - The sync source to use ('local' or 'remote'), defaults to 'local'
 * @returns Promise<BlogPost[]> - Array of blog posts sorted by published date (newest first)
 * @throws Error if listing fails
 */
export async function listBlogPosts(source?: SyncSource): Promise<BlogPost[]> {
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
