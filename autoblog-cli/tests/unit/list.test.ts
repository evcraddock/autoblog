import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { listCommand } from '../../src/commands/list.js';
import { listBlogPosts } from '../../src/lib/automerge.js';
import chalk from 'chalk';
import type { BlogPost } from '../../src/types/index.js';

vi.mock('../../src/lib/automerge.js', () => ({
  listBlogPosts: vi.fn(),
}));
vi.mock('chalk', () => ({
  default: {
    blue: (str: string) => `BLUE: ${str}`,
    green: (str: string) => `GREEN: ${str}`,
    yellow: (str: string) => `YELLOW: ${str}`,
    red: (str: string) => `RED: ${str}`,
    gray: (str: string) => `GRAY: ${str}`,
    bold: {
      blue: (str: string) => `BOLD_BLUE: ${str}`,
    },
  },
}));

describe('List Command', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;
  const mockListBlogPosts = vi.mocked(listBlogPosts);

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

  it('should list all posts in table format', async () => {
    // Mock blog posts
    const mockPosts: BlogPost[] = [
      {
        title: 'Another Post',
        author: 'Another Author',
        published: new Date('2024-01-02'),
        status: 'draft',
        slug: 'another-post',
        description: 'Another description',
        content: 'Another content',
      },
      {
        title: 'Test Post',
        author: 'Test Author',
        published: new Date('2024-01-01'),
        status: 'published',
        slug: 'test-post',
        description: 'Test description',
        content: 'Test content',
      },
    ];

    mockListBlogPosts.mockResolvedValue(mockPosts);

    await listCommand();
    vi.runAllTimers();

    expect(mockListBlogPosts).toHaveBeenCalledWith('remote');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 📚 Fetching blog posts from remote source...'
      )
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Found 2 posts (🌐 Remote)')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Another Post')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test Post')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle empty blog index', async () => {
    mockListBlogPosts.mockResolvedValue([]);

    await listCommand();
    vi.runAllTimers();

    expect(mockListBlogPosts).toHaveBeenCalledWith('remote');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('YELLOW: No blog posts found')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle initialization errors', async () => {
    mockListBlogPosts.mockRejectedValue(new Error('Init failed'));

    await expect(listCommand()).rejects.toThrow('List failed: Init failed');
  });

  it('should display posts in the order returned by listBlogPosts', async () => {
    const mockPosts: BlogPost[] = [
      {
        title: 'First Post',
        author: 'Author',
        published: new Date('2024-01-15'),
        status: 'published',
        slug: 'first-post',
        description: 'First description',
        content: 'First content',
      },
      {
        title: 'Second Post',
        author: 'Author',
        published: new Date('2023-12-01'),
        status: 'published',
        slug: 'second-post',
        description: 'Second description',
        content: 'Second content',
      },
    ];

    mockListBlogPosts.mockResolvedValue(mockPosts);

    await listCommand();
    vi.runAllTimers();

    expect(mockListBlogPosts).toHaveBeenCalledWith('remote');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('First Post')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Second Post')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should use remote source when none specified', async () => {
    mockListBlogPosts.mockResolvedValue([]);

    await listCommand();
    vi.runAllTimers();

    expect(mockListBlogPosts).toHaveBeenCalledWith('remote');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 📚 Fetching blog posts from remote source...'
      )
    );
  });

  it('should use local source when specified', async () => {
    mockListBlogPosts.mockResolvedValue([]);

    await listCommand('local');
    vi.runAllTimers();

    expect(mockListBlogPosts).toHaveBeenCalledWith('local');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 📚 Fetching blog posts from local source...'
      )
    );
  });

  it('should use remote source when explicitly specified', async () => {
    mockListBlogPosts.mockResolvedValue([]);

    await listCommand('remote');
    vi.runAllTimers();

    expect(mockListBlogPosts).toHaveBeenCalledWith('remote');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 📚 Fetching blog posts from remote source...'
      )
    );
  });

  it('should handle invalid source parameter', async () => {
    mockListBlogPosts.mockResolvedValue([]);

    await listCommand('invalid' as any);
    vi.runAllTimers();

    expect(mockListBlogPosts).toHaveBeenCalledWith('invalid');
  });
});
