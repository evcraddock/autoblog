import chalk from 'chalk';
import { deleteBlogPost } from '../lib/automerge.js';
import type { CliConfig } from '../types/config.js';

export async function deleteCommand(
  slug: string,
  options?: { syncUrl?: string; dataPath?: string; [key: string]: any }
): Promise<void> {
  // Validate slug parameter
  if (!slug || slug.trim() === '') {
    throw new Error('Slug is required');
  }

  const trimmedSlug = slug.trim();

  try {
    console.log(chalk.blue(`🗑️ Deleting post with slug: ${trimmedSlug}`));

    // Create config overrides from CLI options
    const configOverrides: Partial<CliConfig> = {};
    if (options?.syncUrl) {
      configOverrides.network = {
        syncUrl: options.syncUrl,
        timeout: 30000, // Default timeout
      };
    }
    if (options?.dataPath) {
      configOverrides.storage = {
        dataPath: options.dataPath,
        indexIdFile: 'index-id.txt', // Default index file
      };
    }

    // Delete the blog post
    const wasDeleted = await deleteBlogPost(trimmedSlug, configOverrides);

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
