import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repo, DocHandle } from '@automerge/automerge-repo';
import {
  getOrCreateIndex,
  updateIndex,
  removeFromIndex,
  findPostBySlug,
} from '../../src/lib/index.js';
import type { BlogIndex } from '../../src/types/index.js';

vi.mock('fs/promises');

describe('Index Management', () => {
  let mockRepo: Repo;
  let mockHandle: DocHandle<BlogIndex>;
  let mockDoc: BlogIndex;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDoc = {
      posts: {},
      lastUpdated: new Date('2024-01-01'),
    };

    mockHandle = {
      whenReady: vi.fn().mockResolvedValue(undefined),
      doc: vi.fn().mockResolvedValue(mockDoc),
      change: vi.fn((fn) => {
        fn(mockDoc);
        return Promise.resolve();
      }),
      documentId: 'test-index-id',
    } as any;

    mockRepo = {
      find: vi.fn().mockReturnValue(mockHandle),
      create: vi.fn().mockReturnValue(mockHandle),
    } as any;

    // Mock fs functions by default
    const fs = await import('fs/promises');
    vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
  });

  describe('getOrCreateIndex', () => {
    it('should create a new index document', async () => {
      const result = await getOrCreateIndex(mockRepo);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockHandle.change).toHaveBeenCalled();
      expect(result).toBe(mockHandle);
    });

    it('should initialize index with empty posts and current date when creating new', async () => {
      // fs.readFile is already mocked to throw in beforeEach
      await getOrCreateIndex(mockRepo);

      // Verify change was called when creating new index
      expect(mockHandle.change).toHaveBeenCalled();
      const changeCallback = (mockHandle.change as any).mock.calls[0][0];
      const testDoc = { posts: {}, lastUpdated: new Date('2023-01-01') };
      changeCallback(testDoc);

      expect(testDoc.posts).toEqual({});
      expect(testDoc.lastUpdated).toBeInstanceOf(Date);
    });

    it('should find and return existing index when document ID exists', async () => {
      // Mock fs.readFile to return existing document ID
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue('existing-doc-id');

      const result = await getOrCreateIndex(mockRepo);

      expect(mockRepo.find).toHaveBeenCalledWith('existing-doc-id');
      expect(mockHandle.whenReady).toHaveBeenCalled();
      expect(result).toBe(mockHandle);
      // Should not call change when finding existing index
      expect(mockHandle.change).not.toHaveBeenCalled();
    });
  });

  describe('updateIndex', () => {
    it('should add new post to index', async () => {
      await updateIndex(mockHandle, 'test-slug', 'doc-123');

      expect(mockHandle.change).toHaveBeenCalled();
      expect(mockDoc.posts['test-slug']).toBe('doc-123');
      expect(mockDoc.lastUpdated).toBeInstanceOf(Date);
    });

    it('should update existing post in index', async () => {
      mockDoc.posts['existing-slug'] = 'old-doc-id';

      await updateIndex(mockHandle, 'existing-slug', 'new-doc-id');

      expect(mockDoc.posts['existing-slug']).toBe('new-doc-id');
    });
  });

  describe('removeFromIndex', () => {
    it('should remove post from index', async () => {
      mockDoc.posts['test-slug'] = 'doc-123';

      await removeFromIndex(mockHandle, 'test-slug');

      expect(mockHandle.change).toHaveBeenCalled();
      expect(mockDoc.posts['test-slug']).toBeUndefined();
      expect(mockDoc.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle removing non-existent slug', async () => {
      await expect(
        removeFromIndex(mockHandle, 'non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('findPostBySlug', () => {
    it('should return document ID for existing slug', async () => {
      mockDoc.posts['test-slug'] = 'doc-123';

      const result = await findPostBySlug(mockHandle, 'test-slug');

      expect(result).toBe('doc-123');
    });

    it('should return null for non-existent slug', async () => {
      const result = await findPostBySlug(mockHandle, 'non-existent');

      expect(result).toBeNull();
    });
  });
});
