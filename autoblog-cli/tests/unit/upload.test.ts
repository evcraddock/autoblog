import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadCommand } from '../../src/commands/upload.js';
import fs from 'fs/promises';
import chalk from 'chalk';

// Mock fs/promises
vi.mock('fs/promises');
const mockFs = vi.mocked(fs);

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: vi.fn((text: string) => `GREEN: ${text}`),
    blue: vi.fn((text: string) => `BLUE: ${text}`),
  },
}));

// Mock automerge and parser modules
vi.mock('../../src/lib/automerge.js', () => ({
  initRepo: vi.fn(),
}));

vi.mock('../../src/lib/parser.js', () => ({
  parseMarkdownFile: vi.fn(),
  generateSlug: vi.fn(),
}));

// Mock @automerge/automerge
vi.mock('@automerge/automerge', () => ({
  next: {},
}));

// Import mocked modules
import { initRepo } from '../../src/lib/automerge.js';
import { parseMarkdownFile, generateSlug } from '../../src/lib/parser.js';

const mockInitRepo = vi.mocked(initRepo);
const mockParseMarkdownFile = vi.mocked(parseMarkdownFile);
const mockGenerateSlug = vi.mocked(generateSlug);

// Mock console methods
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
      // Mock successful parsing
      mockParseMarkdownFile.mockResolvedValue({
        frontmatter: {
          title: 'Test Blog Post',
          author: 'Test Author',
          published: '2025-07-02',
          status: 'draft',
          description: 'A test blog post',
        },
        content: '# Test Blog Post\n\nThis is test content.',
      });

      mockGenerateSlug.mockReturnValue('test-blog-post');

      // Mock Automerge repo
      const mockDocHandle = {
        documentId: 'test-doc-id-123',
        change: vi.fn(),
      };
      const mockRepo = {
        create: vi.fn().mockReturnValue(mockDocHandle),
      };
      mockInitRepo.mockResolvedValue(mockRepo as any);
    });

    it('should successfully upload valid .md file with complete frontmatter', async () => {
      const filePath = 'test-post.md';
      mockFs.access.mockResolvedValue(undefined);

      await uploadCommand(filePath);

      expect(mockFs.access).toHaveBeenCalledWith(filePath);
      expect(mockParseMarkdownFile).toHaveBeenCalledWith(filePath);
      expect(mockGenerateSlug).toHaveBeenCalledWith('Test Blog Post');
      expect(mockInitRepo).toHaveBeenCalled();
      expect(chalk.green).toHaveBeenCalledWith(
        '✅ Successfully uploaded blog post!'
      );
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should handle .md file with minimal frontmatter', async () => {
      const filePath = 'minimal-post.md';
      mockFs.access.mockResolvedValue(undefined);

      mockParseMarkdownFile.mockResolvedValue({
        frontmatter: {
          title: 'Minimal Post',
          author: 'Test Author',
        },
        content: 'Minimal content.',
      });

      await uploadCommand(filePath);

      expect(mockFs.access).toHaveBeenCalledWith(filePath);
      expect(mockParseMarkdownFile).toHaveBeenCalledWith(filePath);
      expect(mockGenerateSlug).toHaveBeenCalledWith('Minimal Post');
      expect(chalk.green).toHaveBeenCalledWith(
        '✅ Successfully uploaded blog post!'
      );
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should handle file in subdirectory', async () => {
      const filePath = 'posts/my-blog-post.md';
      mockFs.access.mockResolvedValue(undefined);

      await uploadCommand(filePath);

      expect(mockFs.access).toHaveBeenCalledWith(filePath);
      expect(mockParseMarkdownFile).toHaveBeenCalledWith(filePath);
      expect(chalk.green).toHaveBeenCalledWith(
        '✅ Successfully uploaded blog post!'
      );
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });

  describe('Frontmatter validation', () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
      mockGenerateSlug.mockReturnValue('test-post');
      const mockDocHandle = { documentId: 'test-id', change: vi.fn() };
      const mockRepo = {
        create: vi.fn().mockReturnValue(mockDocHandle),
      };
      mockInitRepo.mockResolvedValue(mockRepo as any);
    });

    it('should throw error when title is missing', async () => {
      mockParseMarkdownFile.mockResolvedValue({
        frontmatter: { author: 'Test Author' },
        content: 'Content',
      });

      await expect(uploadCommand('test.md')).rejects.toThrow(
        'Missing required field: title in frontmatter'
      );
    });

    it('should throw error when author is missing', async () => {
      mockParseMarkdownFile.mockResolvedValue({
        frontmatter: { title: 'Test Title' },
        content: 'Content',
      });

      await expect(uploadCommand('test.md')).rejects.toThrow(
        'Missing required field: author in frontmatter'
      );
    });

    it('should throw error when slug generation fails', async () => {
      mockParseMarkdownFile.mockResolvedValue({
        frontmatter: { title: 'Test Title', author: 'Test Author' },
        content: 'Content',
      });
      mockGenerateSlug.mockReturnValue('');

      await expect(uploadCommand('test.md')).rejects.toThrow(
        'Unable to generate slug from title'
      );
    });
  });

  describe('Automerge integration errors', () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
      mockParseMarkdownFile.mockResolvedValue({
        frontmatter: { title: 'Test', author: 'Author' },
        content: 'Content',
      });
      mockGenerateSlug.mockReturnValue('test');
    });

    it('should handle Automerge initialization failure', async () => {
      mockInitRepo.mockRejectedValue(
        new Error('Failed to connect to sync server')
      );

      await expect(uploadCommand('test.md')).rejects.toThrow(
        'Upload failed: Failed to connect to sync server'
      );
    });

    it('should handle parsing failure', async () => {
      mockParseMarkdownFile.mockRejectedValue(
        new Error('Invalid frontmatter format')
      );

      await expect(uploadCommand('test.md')).rejects.toThrow(
        'Upload failed: Invalid frontmatter format'
      );
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
