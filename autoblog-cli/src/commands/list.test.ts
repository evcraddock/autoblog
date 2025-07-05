import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listCommand } from './list.js';
import * as automergeLib from '../lib/automerge.js';
import * as indexLib from '../lib/index.js';
import * as originLib from '../lib/document-origin.js';
import chalk from 'chalk';
import type { BlogPost, BlogIndex } from '../types/index.js';

vi.mock('../lib/automerge.js');
vi.mock('../lib/index.js');
vi.mock('../lib/document-origin.js');
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
    };

    mockRepo = {
      find: vi.fn().mockImplementation((id: string) => {
        if (id === 'post-123' || id === 'post-456') {
          return mockPostHandle;
        }
        return null;
      }),
    };

    vi.mocked(automergeLib.initRepo).mockResolvedValue(mockRepo);
    vi.mocked(indexLib.getOrCreateIndex).mockResolvedValue(mockIndexHandle);

    // Mock origin analysis
    vi.mocked(originLib.analyzeDocumentOrigin).mockResolvedValue({
      originatedLocally: true,
      firstActorId: 'actor123',
      createdAt: Date.now(),
      totalActors: 1,
      totalChanges: 1,
      syncStatus: 'local',
    });
    vi.mocked(originLib.formatOriginInfo).mockReturnValue('📝 local');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should list all posts in table format', async () => {
    // Mock first post
    const mockPost1: BlogPost = {
      title: 'Test Post',
      author: 'Test Author',
      published: new Date('2024-01-01'),
      status: 'published',
      slug: 'test-post',
      description: 'Test description',
      content: 'Test content',
    };

    // Mock second post
    const mockPost2: BlogPost = {
      title: 'Another Post',
      author: 'Another Author',
      published: new Date('2024-01-02'),
      status: 'draft',
      slug: 'another-post',
      description: 'Another description',
      content: 'Another content',
    };

    mockRepo.find.mockImplementation((id: string) => {
      if (id === 'post-123') {
        return {
          doc: vi.fn().mockResolvedValue(mockPost1),
          whenReady: vi.fn().mockResolvedValue(undefined),
          documentId: 'post-123',
        };
      } else if (id === 'post-456') {
        return {
          doc: vi.fn().mockResolvedValue(mockPost2),
          whenReady: vi.fn().mockResolvedValue(undefined),
          documentId: 'post-456',
        };
      }
      return null;
    });

    await listCommand();
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 📚 Fetching blog posts from remote source...'
      )
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Found 2 posts (🌐 Remote (with sync))')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test Post')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Another Post')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle empty blog index', async () => {
    const emptyIndex: BlogIndex = {
      posts: {},
      lastUpdated: new Date('2024-01-01'),
    };

    mockIndexHandle.doc.mockResolvedValue(emptyIndex);

    await listCommand();
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('YELLOW: No blog posts found')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle missing index document', async () => {
    mockIndexHandle.doc.mockResolvedValue(null);

    await listCommand();
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('YELLOW: No blog posts found')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle post loading errors gracefully', async () => {
    mockRepo.find.mockImplementation((id: string) => {
      if (id === 'post-123') {
        return null; // Simulate post not found
      } else if (id === 'post-456') {
        return mockPostHandle;
      }
      return null;
    });

    await listCommand();
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Found 1 posts')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test Post')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle initialization errors', async () => {
    vi.mocked(automergeLib.initRepo).mockRejectedValue(
      new Error('Init failed')
    );

    await expect(listCommand()).rejects.toThrow('List failed: Init failed');
  });

  it('should sort posts by published date (newest first)', async () => {
    const olderPost: BlogPost = {
      title: 'Older Post',
      author: 'Author',
      published: new Date('2023-12-01'),
      status: 'published',
      slug: 'older-post',
      description: 'Older description',
      content: 'Older content',
    };

    const newerPost: BlogPost = {
      title: 'Newer Post',
      author: 'Author',
      published: new Date('2024-01-15'),
      status: 'published',
      slug: 'newer-post',
      description: 'Newer description',
      content: 'Newer content',
    };

    mockIndexHandle.doc.mockResolvedValue({
      posts: {
        'older-post': 'post-old',
        'newer-post': 'post-new',
      },
      lastUpdated: new Date('2024-01-01'),
    });

    mockRepo.find.mockImplementation((id: string) => {
      if (id === 'post-old') {
        return {
          doc: vi.fn().mockResolvedValue(olderPost),
          whenReady: vi.fn().mockResolvedValue(undefined),
          documentId: 'post-old',
        };
      } else if (id === 'post-new') {
        return {
          doc: vi.fn().mockResolvedValue(newerPost),
          whenReady: vi.fn().mockResolvedValue(undefined),
          documentId: 'post-new',
        };
      }
      return null;
    });

    await listCommand();
    vi.runAllTimers();

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

  it('should use remote source by default', async () => {
    await listCommand();
    vi.runAllTimers();

    expect(automergeLib.initRepo).toHaveBeenCalledWith('remote');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 📚 Fetching blog posts from remote source...'
      )
    );
  });

  it('should use local source when specified', async () => {
    await listCommand('local');
    vi.runAllTimers();

    expect(automergeLib.initRepo).toHaveBeenCalledWith('local');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 📚 Fetching blog posts from local source...'
      )
    );
  });

  it('should use remote source when explicitly specified', async () => {
    await listCommand('remote');
    vi.runAllTimers();

    expect(automergeLib.initRepo).toHaveBeenCalledWith('remote');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'BLUE: 📚 Fetching blog posts from remote source...'
      )
    );
  });
});
