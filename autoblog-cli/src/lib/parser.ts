import { readFile } from 'fs/promises';
import matter from 'gray-matter';
import { resolve } from 'path';
import type { ParsedMarkdown } from '../types/index.js';

/**
 * Parse a markdown file and extract frontmatter and content
 * @param filePath - Absolute path to the markdown file
 * @returns Promise<ParsedMarkdown> - Object containing frontmatter and content
 * @throws Error if file cannot be read or parsed
 */
export async function parseMarkdownFile(
  filePath: string
): Promise<ParsedMarkdown> {
  try {
    // Read the file content
    const fileContent = await readFile(filePath, 'utf-8');

    // Parse frontmatter using gray-matter
    const parsed = matter(fileContent);

    return {
      frontmatter: parsed.data,
      content: parsed.content,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to parse markdown file "${filePath}": ${message}`);
  }
}

/**
 * Generate a URL-safe slug from a title string
 * @param title - The title string to convert
 * @returns string - URL-safe slug
 */
export function generateSlug(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }

  return title
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}
