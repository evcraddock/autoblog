import { describe, it, expect, beforeEach, vi } from 'vitest';
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

    expect(mockListBlogPosts).toHaveBeenCalledWith('local');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 📚 Fetching blog posts from local source...'
      )
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Found 2 posts (📱 Local)')
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

    expect(mockListBlogPosts).toHaveBeenCalledWith('local');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('YELLOW: No blog posts found')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle missing index document', async () => {
    mockListBlogPosts.mockResolvedValue([]);

    await listCommand();
    vi.runAllTimers();

    expect(mockListBlogPosts).toHaveBeenCalledWith('local');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('YELLOW: No blog posts found')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle post loading errors gracefully', async () => {
    // listBlogPosts handles loading errors internally and only returns successfully loaded posts
    const mockPosts: BlogPost[] = [
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

    expect(mockListBlogPosts).toHaveBeenCalledWith('local');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Found 1 posts')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test Post')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle initialization errors', async () => {
    mockListBlogPosts.mockRejectedValue(new Error('Init failed'));

    await expect(listCommand()).rejects.toThrow('List failed: Init failed');
  });

  it('should sort posts by published date (newest first)', async () => {
    // listBlogPosts returns posts already sorted by published date (newest first)
    const mockPosts: BlogPost[] = [
      {
        title: 'Newer Post',
        author: 'Author',
        published: new Date('2024-01-15'),
        status: 'published',
        slug: 'newer-post',
        description: 'Newer description',
        content: 'Newer content',
      },
      {
        title: 'Older Post',
        author: 'Author',
        published: new Date('2023-12-01'),
        status: 'published',
        slug: 'older-post',
        description: 'Older description',
        content: 'Older content',
      },
    ];

    mockListBlogPosts.mockResolvedValue(mockPosts);

    await listCommand();
    vi.runAllTimers();

    expect(mockListBlogPosts).toHaveBeenCalledWith('local');
    const calls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]);
    const tableOutput = calls.find(
      (output: string) =>
        output.includes('Newer Post') && output.includes('Older Post')
    );

    // Verify newer post appears before older post in the output
    const newerIndex = tableOutput.indexOf('Newer Post');
    const olderIndex = tableOutput.indexOf('Older Post');
    expect(newerIndex).toBeLessThan(olderIndex);
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should use local source when none specified', async () => {
    mockListBlogPosts.mockResolvedValue([]);

    await listCommand();
    vi.runAllTimers();

    expect(mockListBlogPosts).toHaveBeenCalledWith('local');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 📚 Fetching blog posts from local source...'
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
});
