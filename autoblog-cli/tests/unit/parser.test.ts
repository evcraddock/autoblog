import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { vol } from 'memfs';
import { parseMarkdownFile, generateSlug } from '../../src/lib/parser.js';

// Mock the file system
vi.mock('fs/promises', async () => {
  const memfs = await vi.importActual<typeof import('memfs')>('memfs');
  return {
    default: memfs.fs.promises,
    ...memfs.fs.promises,
  };
});

describe('Parser Module', () => {
  beforeEach(() => {
    // Clear the virtual file system before each test
    vol.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateSlug function', () => {
    it('should convert basic title to lowercase slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should handle titles with special characters', () => {
      expect(generateSlug('Hello, World! & More')).toBe('hello-world-more');
    });

    it('should handle titles with numbers', () => {
      expect(generateSlug('Version 2.0 Release')).toBe('version-20-release');
    });

    it('should handle multiple spaces and special chars', () => {
      expect(generateSlug('  Multiple   Spaces  & Special!@#$%^&*()  ')).toBe(
        'multiple-spaces-special'
      );
    });

    it('should handle underscores and hyphens', () => {
      expect(generateSlug('test_with_underscores-and-hyphens')).toBe(
        'test-with-underscores-and-hyphens'
      );
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle whitespace-only string', () => {
      expect(generateSlug('   ')).toBe('');
    });

    it('should handle special characters only', () => {
      expect(generateSlug('!@#$%^&*()')).toBe('');
    });

    it('should handle non-string input gracefully', () => {
      expect(generateSlug(null as any)).toBe('');
      expect(generateSlug(undefined as any)).toBe('');
      expect(generateSlug(123 as any)).toBe('');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateSlug('-leading-and-trailing-')).toBe(
        'leading-and-trailing'
      );
    });

    it('should handle unicode characters', () => {
      expect(generateSlug('Café & Naïve résumé')).toBe('caf-nave-rsum');
    });
  });

  describe('parseMarkdownFile function', () => {
    it('should parse valid markdown with frontmatter', async () => {
      const markdownContent = `---
title: "Test Post"
author: "John Doe"
published: "2024-01-01"
status: "draft"
---

# Test Post

This is test content.`;

      vol.fromJSON({
        '/test/sample.md': markdownContent,
      });

      const result = await parseMarkdownFile('/test/sample.md');

      expect(result.frontmatter).toEqual({
        title: 'Test Post',
        author: 'John Doe',
        published: '2024-01-01',
        status: 'draft',
      });
      expect(result.content).toBe('\n# Test Post\n\nThis is test content.');
    });

    it('should parse markdown without frontmatter', async () => {
      const markdownContent = `# Post Without Frontmatter

This post has no frontmatter.`;

      vol.fromJSON({
        '/test/no-frontmatter.md': markdownContent,
      });

      const result = await parseMarkdownFile('/test/no-frontmatter.md');

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe(
        '# Post Without Frontmatter\n\nThis post has no frontmatter.'
      );
    });

    it('should handle empty markdown file', async () => {
      vol.fromJSON({
        '/test/empty.md': '',
      });

      const result = await parseMarkdownFile('/test/empty.md');

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe('');
    });

    it('should handle frontmatter only', async () => {
      const markdownContent = `---
title: "Only Frontmatter"
author: "Test Author"
---`;

      vol.fromJSON({
        '/test/frontmatter-only.md': markdownContent,
      });

      const result = await parseMarkdownFile('/test/frontmatter-only.md');

      expect(result.frontmatter).toEqual({
        title: 'Only Frontmatter',
        author: 'Test Author',
      });
      expect(result.content).toBe('');
    });

    it('should handle complex frontmatter with arrays and objects', async () => {
      const markdownContent = `---
title: "Complex Post"
tags: 
  - javascript
  - typescript
  - testing
meta:
  seo:
    description: "SEO description"
    keywords: ["js", "ts"]
published: true
---

# Complex Post

Content here.`;

      vol.fromJSON({
        '/test/complex.md': markdownContent,
      });

      const result = await parseMarkdownFile('/test/complex.md');

      expect(result.frontmatter).toEqual({
        title: 'Complex Post',
        tags: ['javascript', 'typescript', 'testing'],
        meta: {
          seo: {
            description: 'SEO description',
            keywords: ['js', 'ts'],
          },
        },
        published: true,
      });
      expect(result.content).toBe('\n# Complex Post\n\nContent here.');
    });

    it('should throw error for non-existent file', async () => {
      await expect(parseMarkdownFile('/nonexistent/file.md')).rejects.toThrow(
        'Failed to parse markdown file "/nonexistent/file.md"'
      );
    });

    it('should handle invalid YAML frontmatter gracefully', async () => {
      const markdownContent = `---
title: "Test Post
author: John Doe
invalid: yaml: content: here
---

# Content`;

      vol.fromJSON({
        '/test/invalid-yaml.md': markdownContent,
      });

      // This should throw an error because the YAML is invalid
      await expect(parseMarkdownFile('/test/invalid-yaml.md')).rejects.toThrow(
        'Failed to parse markdown file "/test/invalid-yaml.md"'
      );
    });

    it('should preserve markdown formatting in content', async () => {
      const markdownContent = `---
title: "Formatting Test"
---

# Heading 1

## Heading 2

**Bold text** and *italic text*.

- List item 1
- List item 2

\`\`\`javascript
console.log('code block');
\`\`\`

[Link](https://example.com)`;

      vol.fromJSON({
        '/test/formatting.md': markdownContent,
      });

      const result = await parseMarkdownFile('/test/formatting.md');

      expect(result.content).toContain('# Heading 1');
      expect(result.content).toContain('**Bold text**');
      expect(result.content).toContain('```javascript');
      expect(result.content).toContain('[Link](https://example.com)');
    });

    it('should handle files with different encodings', async () => {
      const markdownContent = `---
title: "UTF-8 Test"
---

# Special Characters

Café, naïve, résumé, 日本語, emoji: 🚀`;

      vol.fromJSON({
        '/test/utf8.md': markdownContent,
      });

      const result = await parseMarkdownFile('/test/utf8.md');

      expect(result.frontmatter.title).toBe('UTF-8 Test');
      expect(result.content).toContain(
        'Café, naïve, résumé, 日本語, emoji: 🚀'
      );
    });

    it('should handle very large files', async () => {
      const largeContent = 'A'.repeat(10000);
      const markdownContent = `---
title: "Large File Test"
---

${largeContent}`;

      vol.fromJSON({
        '/test/large.md': markdownContent,
      });

      const result = await parseMarkdownFile('/test/large.md');

      expect(result.frontmatter.title).toBe('Large File Test');
      expect(result.content).toBe('\n' + largeContent);
    });
  });

  describe('Real fixture files integration', () => {
    it('should parse sample-post.md fixture correctly', async () => {
      // Note: This test assumes the actual fixture files exist
      // In a real test environment, we'd either copy them to memfs
      // or use the actual filesystem for integration tests

      const sampleContent = `---
title: "Sample Blog Post"
author: "John Doe"
published: "2024-01-15"
status: "published"
description: "This is a sample blog post for testing the markdown parser"
tags: ["test", "markdown", "blog"]
---

# Sample Blog Post

This is a **sample blog post** with some content for testing the markdown parser.`;

      vol.fromJSON({
        '/fixtures/sample-post.md': sampleContent,
      });

      const result = await parseMarkdownFile('/fixtures/sample-post.md');

      expect(result.frontmatter.title).toBe('Sample Blog Post');
      expect(result.frontmatter.author).toBe('John Doe');
      expect(result.frontmatter.tags).toEqual(['test', 'markdown', 'blog']);
      expect(result.content).toContain('# Sample Blog Post');
      expect(result.content).toContain('**sample blog post**');
    });
  });

  describe('Error handling', () => {
    it('should provide helpful error messages', async () => {
      vol.fromJSON({
        '/test/': null, // This will cause a read error
      });

      await expect(parseMarkdownFile('/test/unreadable.md')).rejects.toThrow(
        'Failed to parse markdown file "/test/unreadable.md"'
      );
    });

    it('should handle file system errors gracefully', async () => {
      // Test with a file that causes an error in gray-matter parsing
      const invalidContent = `---
title: "Valid start
but: invalid: syntax
---
content`;

      vol.fromJSON({
        '/test/error-file.md': invalidContent,
      });

      await expect(parseMarkdownFile('/test/error-file.md')).rejects.toThrow(
        'Failed to parse markdown file "/test/error-file.md"'
      );
    });
  });
});
