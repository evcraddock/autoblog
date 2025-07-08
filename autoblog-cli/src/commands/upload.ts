import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { uploadBlogPost, SyncSource } from '../lib/automerge.js';
import { parseMarkdownFile, generateSlug } from '../lib/parser.js';
import type { BlogPost } from '../types/index.js';
import type { CliConfig } from '../types/config.js';

export async function uploadCommand(
  filePath: string,
  source: SyncSource = 'all',
  options?: { syncUrl?: string; dataPath?: string; [key: string]: any }
): Promise<void> {
  // Validate file path is provided
  if (!filePath || filePath.trim() === '') {
    throw new Error('File path is required');
  }

  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  // Check if file has .md extension
  const extension = path.extname(filePath);
  if (extension !== '.md') {
    throw new Error(`Invalid file extension. Expected .md, got ${extension}`);
  }

  try {
    console.log(chalk.blue('🔄 Parsing markdown file...'));

    // Parse the markdown file
    const { frontmatter, content } = await parseMarkdownFile(filePath);

    // Validate required frontmatter fields
    if (!frontmatter.title) {
      throw new Error('Missing required field: title in frontmatter');
    }
    if (!frontmatter.author) {
      throw new Error('Missing required field: author in frontmatter');
    }

    // Generate slug from title
    const slug = generateSlug(frontmatter.title);
    if (!slug) {
      throw new Error('Unable to generate slug from title');
    }

    // Create BlogPost object
    const blogPost: Partial<BlogPost> = {
      title: frontmatter.title,
      author: frontmatter.author,
      published: frontmatter.published
        ? new Date(frontmatter.published)
        : new Date(),
      status: frontmatter.status === 'published' ? 'published' : 'draft',
      slug,
      description: frontmatter.description || '',
      content,
    };

    // Only add imageUrl if it's provided to avoid undefined values
    if (frontmatter.imageUrl) {
      blogPost.imageUrl = frontmatter.imageUrl;
    }

    console.log(chalk.blue('🔄 Uploading blog post...'));

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

    // Upload the blog post
    const documentId = await uploadBlogPost(blogPost, source, configOverrides);

    console.log(chalk.green(`✅ Successfully uploaded blog post!`));
    console.log(chalk.blue(`   📄 Title: ${blogPost.title}`));
    console.log(chalk.blue(`   👤 Author: ${blogPost.author}`));
    console.log(chalk.blue(`   🏷️  Slug: ${slug}`));
    console.log(chalk.blue(`   📅 Status: ${blogPost.status}`));
    console.log(chalk.blue(`   🔗 Document ID: ${documentId}`));

    // Force process exit after a short delay to allow output to flush
    // This is needed because the WebSocket connection keeps the process alive
    setTimeout(() => {
      process.exit(0);
    }, 100);
  } catch (error) {
    throw new Error(
      `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
