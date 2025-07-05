import chalk from 'chalk';
import Table from 'cli-table3';
import { DocumentId } from '@automerge/automerge-repo';
import { initRepo, SyncSource } from '../lib/automerge.js';
import { getOrCreateIndex } from '../lib/index.js';
import type { BlogPost } from '../types/index.js';

export async function listCommand(
  source: SyncSource = 'remote'
): Promise<void> {
  try {
    console.log(chalk.blue(`📚 Fetching blog posts from ${source} source...`));

    // Initialize Automerge repo
    const repo = await initRepo(source);

    // Get the blog index
    const indexHandle = await getOrCreateIndex(repo);
    const index = await indexHandle.doc();

    // Check if we have any posts
    if (!index || !index.posts || Object.keys(index.posts).length === 0) {
      console.log(chalk.yellow('No blog posts found.'));
      setTimeout(() => process.exit(0), 100);
      return;
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
        // Skip posts that fail to load
        console.error(chalk.yellow(`Failed to load post with slug: ${slug}`));
      }
    }

    // Sort posts by published date (newest first)
    posts.sort((a, b) => {
      const dateA = new Date(a.published).getTime();
      const dateB = new Date(b.published).getTime();
      return dateB - dateA;
    });

    const sourceIndicator =
      source === 'local' ? '📱 Local (offline)' : '🌐 Remote (with sync)';
    console.log(
      chalk.green(`\nFound ${posts.length} posts (${sourceIndicator}):\n`)
    );

    // Create a table for display
    const table = new Table({
      head: [
        chalk.bold.blue('Title'),
        chalk.bold.blue('Slug'),
        chalk.bold.blue('Author'),
        chalk.bold.blue('Published'),
        chalk.bold.blue('Status'),
      ],
      colWidths: [30, 25, 20, 12, 10],
      wordWrap: true,
    });

    // Add posts to the table
    posts.forEach((post) => {
      const publishedDate = new Date(post.published).toLocaleDateString();
      const statusColor =
        post.status === 'published' ? chalk.green : chalk.yellow;

      table.push([
        post.title,
        post.slug,
        post.author,
        publishedDate,
        statusColor(post.status),
      ]);
    });

    console.log(table.toString());

    // Force process exit after a short delay
    setTimeout(() => process.exit(0), 100);
  } catch (error) {
    throw new Error(
      `List failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
