import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadCommand } from '../../src/commands/upload.js';
import fs, { readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    readFile: vi.fn(),
  },
  readFile: vi.fn(),
}));
const mockFs = vi.mocked(fs);
const mockReadFile = vi.mocked(readFile);

// Mock only the automerge module for network operations
vi.mock('../../src/lib/automerge.js', () => ({
  uploadBlogPost: vi.fn(),
}));

// Import mocked modules
import { uploadBlogPost } from '../../src/lib/automerge.js';
const mockUploadBlogPost = vi.mocked(uploadBlogPost);

// Mock console methods to avoid cluttering test output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

// Mock process.exit to do nothing
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  // Do nothing - just prevent actual exit
  return undefined as never;
});

// Mock setTimeout to execute immediately
vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
  fn(); // Execute immediately instead of delaying
  return 0 as any;
});

describe('Upload Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe('File validation', () => {
    it('should throw error for empty file path', async () => {
      await expect(uploadCommand('')).rejects.toThrow('File path is required');
      await expect(uploadCommand('   ')).rejects.toThrow(
        'File path is required'
      );
    });

    it('should throw error for missing file path', async () => {
      await expect(uploadCommand(undefined as any)).rejects.toThrow(
        'File path is required'
      );
    });

    it('should throw error when file does not exist', async () => {
      const filePath = 'non-existent-file.md';
      mockFs.access.mockRejectedValue(
        new Error('ENOENT: no such file or directory')
      );

      await expect(uploadCommand(filePath)).rejects.toThrow(
        `File does not exist: ${filePath}`
      );
      expect(mockFs.access).toHaveBeenCalledWith(filePath);
    });

    it('should throw error for non-.md file extension', async () => {
      const filePath = 'test-file.txt';
      mockFs.access.mockResolvedValue(undefined);

      await expect(uploadCommand(filePath)).rejects.toThrow(
        'Invalid file extension. Expected .md, got .txt'
      );
      expect(mockFs.access).toHaveBeenCalledWith(filePath);
    });

    it('should throw error for file with no extension', async () => {
      const filePath = 'test-file';
      mockFs.access.mockResolvedValue(undefined);

      await expect(uploadCommand(filePath)).rejects.toThrow(
        'Invalid file extension. Expected .md, got '
      );
      expect(mockFs.access).toHaveBeenCalledWith(filePath);
    });
  });

  describe('Success scenarios', () => {
    beforeEach(() => {
      // Mock uploadBlogPost
      mockUploadBlogPost.mockResolvedValue('test-doc-id-123');
    });

    it('should successfully upload valid .md file with complete frontmatter', async () => {
      const filePath = 'test-post.md';
      const testContent = `---
title: Test Blog Post
author: Test Author
published: 2025-07-02
status: draft
description: A test blog post
---

# Test Blog Post

This is test content.`;

      mockFs.access.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(testContent);

      await uploadCommand(filePath);

      expect(mockFs.access).toHaveBeenCalledWith(filePath);
      expect(mockUploadBlogPost).toHaveBeenCalledWith(
        {
          title: 'Test Blog Post',
          author: 'Test Author',
          published: new Date('2025-07-02'),
          status: 'draft',
          slug: 'test-blog-post',
          description: 'A test blog post',
          content: '\n# Test Blog Post\n\nThis is test content.',
        },
        {}
      );
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should handle .md file with minimal frontmatter', async () => {
      const filePath = 'minimal-post.md';
      const testContent = `---
title: Minimal Post
author: Test Author
---

Minimal content.`;

      mockFs.access.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(testContent);

      await uploadCommand(filePath);

      expect(mockFs.access).toHaveBeenCalledWith(filePath);
      expect(mockUploadBlogPost).toHaveBeenCalledWith(
        {
          title: 'Minimal Post',
          author: 'Test Author',
          published: expect.any(Date),
          status: 'draft',
          slug: 'minimal-post',
          description: '',
          content: '\nMinimal content.',
        },
        {}
      );
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should handle file in subdirectory', async () => {
      const filePath = 'posts/my-blog-post.md';
      const testContent = `---
title: My Blog Post
author: Test Author
---

Content in subdirectory.`;

      mockFs.access.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(testContent);

      await uploadCommand(filePath);

      expect(mockFs.access).toHaveBeenCalledWith(filePath);
      expect(mockUploadBlogPost).toHaveBeenCalled();
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });

  describe('Frontmatter validation', () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
    });

    it('should throw error when title is missing', async () => {
      const filePath = 'no-title.md';
      const testContent = `---
author: Test Author
---

Content`;

      mockReadFile.mockResolvedValue(testContent);

      await expect(uploadCommand(filePath)).rejects.toThrow(
        'Missing required field: title in frontmatter'
      );
    });

    it('should throw error when author is missing', async () => {
      const filePath = 'no-author.md';
      const testContent = `---
title: Test Title
---

Content`;

      mockReadFile.mockResolvedValue(testContent);

      await expect(uploadCommand(filePath)).rejects.toThrow(
        'Missing required field: author in frontmatter'
      );
    });

    it('should throw error when slug generation fails', async () => {
      const filePath = 'bad-title.md';
      const testContent = `---
title: "   "
author: Test Author
---

Content`;

      mockReadFile.mockResolvedValue(testContent);

      await expect(uploadCommand(filePath)).rejects.toThrow(
        'Unable to generate slug from title'
      );
    });
  });

  describe('Automerge integration errors', () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
    });

    it('should handle Automerge initialization failure', async () => {
      const filePath = 'test.md';
      const testContent = `---
title: Test
author: Author
---

Content`;

      mockReadFile.mockResolvedValue(testContent);
      mockUploadBlogPost.mockRejectedValue(
        new Error('Failed to connect to sync server')
      );

      await expect(uploadCommand(filePath)).rejects.toThrow(
        'Upload failed: Failed to connect to sync server'
      );
    });

    it('should handle parsing failure', async () => {
      const filePath = 'bad.md';
      const badContent = `---
title: Test
author: Author
--

Content`; // Invalid frontmatter

      mockFs.readFile.mockResolvedValue(badContent);

      await expect(uploadCommand(filePath)).rejects.toThrow('Upload failed:');
    });
  });

  describe('Edge cases', () => {
    it('should handle file with uppercase .MD extension', async () => {
      const filePath = 'test-post.MD';
      mockFs.access.mockResolvedValue(undefined);

      await expect(uploadCommand(filePath)).rejects.toThrow(
        'Invalid file extension. Expected .md, got .MD'
      );
    });

    it('should handle file with mixed case .Md extension', async () => {
      const filePath = 'test-post.Md';
      mockFs.access.mockResolvedValue(undefined);

      await expect(uploadCommand(filePath)).rejects.toThrow(
        'Invalid file extension. Expected .md, got .Md'
      );
    });
  });
});
