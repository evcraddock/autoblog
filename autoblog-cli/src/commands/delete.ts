import chalk from 'chalk';
import { deleteBlogPost, SyncSource } from '../lib/automerge.js';

export async function deleteCommand(
  slug: string,
  source: SyncSource = 'all'
): Promise<void> {
  // Validate slug parameter
  if (!slug || slug.trim() === '') {
    throw new Error('Slug is required');
  }

  const trimmedSlug = slug.trim();

  try {
    console.log(chalk.blue(`🗑️ Deleting post with slug: ${trimmedSlug}`));

    // Delete the blog post
    const wasDeleted = await deleteBlogPost(trimmedSlug, source);

    if (!wasDeleted) {
      console.log(chalk.yellow(`Post not found with slug: ${trimmedSlug}`));
      setTimeout(() => process.exit(0), 100);
      return;
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
