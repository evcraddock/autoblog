import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { deleteCommand } from '../../src/commands/delete.js';
import { deleteBlogPost } from '../../src/lib/automerge.js';
import chalk from 'chalk';

vi.mock('../../src/lib/automerge.js', () => ({
  deleteBlogPost: vi.fn(),
}));
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
  const mockDeleteBlogPost = vi.mocked(deleteBlogPost);

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
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should successfully delete an existing post', async () => {
    mockDeleteBlogPost.mockResolvedValue(true);

    await deleteCommand('test-post');
    vi.runAllTimers();

    expect(mockDeleteBlogPost).toHaveBeenCalledWith('test-post');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('BLUE: 🗑️ Deleting post with slug: test-post')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('GREEN: ✅ Successfully deleted post: test-post')
    );
  });

  it('should handle non-existent slug gracefully', async () => {
    mockDeleteBlogPost.mockResolvedValue(false);

    await deleteCommand('non-existent-slug');
    vi.runAllTimers();

    expect(mockDeleteBlogPost).toHaveBeenCalledWith('non-existent-slug');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 🗑️ Deleting post with slug: non-existent-slug'
      )
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'YELLOW: Post not found with slug: non-existent-slug'
      )
    );
  });

  it('should validate slug parameter', async () => {
    await expect(deleteCommand('')).rejects.toThrow('Slug is required');
    await expect(deleteCommand('   ')).rejects.toThrow('Slug is required');
  });

  it('should handle initialization errors', async () => {
    mockDeleteBlogPost.mockRejectedValue(new Error('Init failed'));

    await expect(deleteCommand('test-post')).rejects.toThrow(
      'Delete failed: Init failed'
    );
  });

  it('should handle index errors', async () => {
    mockDeleteBlogPost.mockRejectedValue(new Error('Index failed'));

    await expect(deleteCommand('test-post')).rejects.toThrow(
      'Delete failed: Index failed'
    );
  });

  it('should handle empty index gracefully', async () => {
    mockDeleteBlogPost.mockResolvedValue(false);

    await deleteCommand('any-slug');
    vi.runAllTimers();

    expect(mockDeleteBlogPost).toHaveBeenCalledWith('any-slug');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('YELLOW: Post not found with slug: any-slug')
    );
  });
});
