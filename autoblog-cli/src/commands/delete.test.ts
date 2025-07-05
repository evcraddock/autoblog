import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteCommand } from './delete.js';
import * as automergeLib from '../lib/automerge.js';
import * as indexLib from '../lib/index.js';
import chalk from 'chalk';
import type { BlogPost, BlogIndex } from '../types/index.js';

vi.mock('../lib/automerge.js');
vi.mock('../lib/index.js');
vi.mock('chalk', () => ({
  default: {
    blue: (str: string) => `BLUE: ${str}`,
    green: (str: string) => `GREEN: ${str}`,
    yellow: (str: string) => `YELLOW: ${str}`,
    red: (str: string) => `RED: ${str}`,
  },
}));

describe('Delete Command', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let mockRepo: any;
  let mockIndexHandle: any;
  let mockPostHandle: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: any) => {
        return undefined as never;
      });

    // Mock post document
    const mockPost: BlogPost = {
      title: 'Test Post',
      author: 'Test Author',
      published: new Date('2024-01-01'),
      status: 'published',
      slug: 'test-post',
      description: 'Test description',
      content: 'Test content',
    };

    mockPostHandle = {
      doc: vi.fn().mockResolvedValue(mockPost),
      whenReady: vi.fn().mockResolvedValue(undefined),
      documentId: 'post-123',
    };

    // Mock index document
    const mockIndex: BlogIndex = {
      posts: {
        'test-post': 'post-123',
        'another-post': 'post-456',
      },
      lastUpdated: new Date('2024-01-01'),
    };

    mockIndexHandle = {
      doc: vi.fn().mockResolvedValue(mockIndex),
      whenReady: vi.fn().mockResolvedValue(undefined),
      documentId: 'index-123',
      change: vi.fn().mockResolvedValue(undefined),
    };

    mockRepo = {
      find: vi.fn().mockImplementation((id: string) => {
        if (id === 'post-123') {
          return Promise.resolve(mockPostHandle);
        }
        return Promise.resolve(null);
      }),
    };

    vi.mocked(automergeLib.initRepo).mockResolvedValue(mockRepo);
    vi.mocked(indexLib.getOrCreateIndex).mockResolvedValue(mockIndexHandle);
    vi.mocked(indexLib.findPostBySlug).mockImplementation(
      async (handle, slug) => {
        const doc = await handle.doc();
        return doc?.posts[slug] || null;
      }
    );
    vi.mocked(indexLib.removeFromIndex).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should successfully delete an existing post', async () => {
    await deleteCommand('test-post');
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('BLUE: 🗑️ Deleting post with slug: test-post')
    );
    expect(indexLib.findPostBySlug).toHaveBeenCalledWith(
      mockIndexHandle,
      'test-post'
    );
    expect(mockRepo.find).toHaveBeenCalledWith('post-123');
    expect(indexLib.removeFromIndex).toHaveBeenCalledWith(
      mockIndexHandle,
      'test-post'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('GREEN: ✅ Successfully deleted post: test-post')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle non-existent slug gracefully', async () => {
    vi.mocked(indexLib.findPostBySlug).mockResolvedValue(null);

    await deleteCommand('non-existent-slug');
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 🗑️ Deleting post with slug: non-existent-slug'
      )
    );
    expect(indexLib.findPostBySlug).toHaveBeenCalledWith(
      mockIndexHandle,
      'non-existent-slug'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'YELLOW: Post not found with slug: non-existent-slug'
      )
    );
    expect(mockRepo.find).not.toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle post document not found in repo', async () => {
    mockRepo.find.mockResolvedValue(null);

    await deleteCommand('test-post');

    expect(indexLib.findPostBySlug).toHaveBeenCalledWith(
      mockIndexHandle,
      'test-post'
    );
    expect(mockRepo.find).toHaveBeenCalledWith('post-123');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('YELLOW: Post document not found in repository')
    );
    // Should still remove from index even if document is missing
    expect(indexLib.removeFromIndex).toHaveBeenCalledWith(
      mockIndexHandle,
      'test-post'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('GREEN: ✅ Successfully deleted post: test-post')
    );
  });

  it('should handle post document verification failure gracefully', async () => {
    mockRepo.find.mockRejectedValue(new Error('Find failed'));

    await deleteCommand('test-post');

    expect(mockRepo.find).toHaveBeenCalledWith('post-123');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('YELLOW: Warning: Could not verify post document')
    );
    // Should still remove from index even if document verification fails
    expect(indexLib.removeFromIndex).toHaveBeenCalledWith(
      mockIndexHandle,
      'test-post'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('GREEN: ✅ Successfully deleted post: test-post')
    );
  });

  it('should validate slug parameter', async () => {
    await expect(deleteCommand('')).rejects.toThrow('Slug is required');
    await expect(deleteCommand('   ')).rejects.toThrow('Slug is required');
  });

  it('should handle initialization errors', async () => {
    vi.mocked(automergeLib.initRepo).mockRejectedValue(
      new Error('Init failed')
    );

    await expect(deleteCommand('test-post')).rejects.toThrow(
      'Delete failed: Init failed'
    );
  });

  it('should handle index errors', async () => {
    vi.mocked(indexLib.getOrCreateIndex).mockRejectedValue(
      new Error('Index failed')
    );

    await expect(deleteCommand('test-post')).rejects.toThrow(
      'Delete failed: Index failed'
    );
  });

  it('should handle index update errors but still succeed', async () => {
    vi.mocked(indexLib.removeFromIndex).mockRejectedValue(
      new Error('Index update failed')
    );

    await deleteCommand('test-post');

    expect(mockRepo.find).toHaveBeenCalledWith('post-123');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('YELLOW: Warning: Failed to update index')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('GREEN: ✅ Successfully deleted post: test-post')
    );
  });

  it('should handle empty index gracefully', async () => {
    const emptyIndex: BlogIndex = {
      posts: {},
      lastUpdated: new Date('2024-01-01'),
    };
    mockIndexHandle.doc.mockResolvedValue(emptyIndex);
    vi.mocked(indexLib.findPostBySlug).mockResolvedValue(null);

    await deleteCommand('any-slug');
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('YELLOW: Post not found with slug: any-slug')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });
});
