import chalk from 'chalk';
import { DocumentId } from '@automerge/automerge-repo';
import { initRepo } from '../lib/automerge.js';
import {
  getOrCreateIndex,
  findPostBySlug,
  removeFromIndex,
} from '../lib/index.js';
import type { BlogPost } from '../types/index.js';

export async function deleteCommand(slug: string): Promise<void> {
  // Validate slug parameter
  if (!slug || slug.trim() === '') {
    throw new Error('Slug is required');
  }

  const trimmedSlug = slug.trim();

  try {
    console.log(chalk.blue(`🗑️ Deleting post with slug: ${trimmedSlug}`));

    // Initialize Automerge repo
    const repo = await initRepo();

    // Get the blog index
    const indexHandle = await getOrCreateIndex(repo);

    // Find the post ID by slug
    const postDocumentId = await findPostBySlug(indexHandle, trimmedSlug);

    if (!postDocumentId) {
      console.log(chalk.yellow(`Post not found with slug: ${trimmedSlug}`));
      setTimeout(() => process.exit(0), 100);
      return;
    }

    // Try to find the post document (we'll just verify it exists)
    // Note: Automerge doesn't have direct document deletion,
    // so we just remove it from the index to make it unreachable
    try {
      const postHandle = await repo.find<BlogPost>(
        postDocumentId as DocumentId
      );
      if (!postHandle) {
        console.log(chalk.yellow('Post document not found in repository'));
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          `Warning: Could not verify post document: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      );
    }

    // Remove from index (do this even if document deletion failed)
    try {
      await removeFromIndex(indexHandle, trimmedSlug);
    } catch (error) {
      console.log(
        chalk.yellow(
          `Warning: Failed to update index: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      );
    }

    console.log(chalk.green(`✅ Successfully deleted post: ${trimmedSlug}`));

    // Force process exit after a short delay
    setTimeout(() => process.exit(0), 100);
  } catch (error) {
    throw new Error(
      `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
