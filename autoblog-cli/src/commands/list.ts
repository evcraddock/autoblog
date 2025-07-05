import chalk from 'chalk';
import Table from 'cli-table3';
import { listBlogPosts, SyncSource } from '../lib/automerge.js';
import type { BlogPost } from '../types/index.js';

export async function listCommand(
  source: SyncSource = 'remote'
): Promise<void> {
  try {
    console.log(chalk.blue(`📚 Fetching blog posts from ${source} source...`));

    // Get all blog posts
    const posts = await listBlogPosts(source);

    // Check if we have any posts
    if (posts.length === 0) {
      console.log(chalk.yellow('No blog posts found.'));
      setTimeout(() => process.exit(0), 100);
      return;
    }

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
