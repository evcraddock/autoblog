import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repo, DocHandle } from '@automerge/automerge-repo';
import {
  getOrCreateIndex,
  updateIndex,
  removeFromIndex,
  findPostBySlug,
} from './index.js';
import type { BlogIndex } from '../types/index.js';

describe('Index Management', () => {
  let mockRepo: Repo;
  let mockHandle: DocHandle<BlogIndex>;
  let mockDoc: BlogIndex;

  beforeEach(() => {
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
  });

  describe('getOrCreateIndex', () => {
    it('should create a new index document', async () => {
      const result = await getOrCreateIndex(mockRepo);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockHandle.change).toHaveBeenCalled();
      expect(result).toBe(mockHandle);
    });

    it('should initialize index with empty posts and current date', async () => {
      await getOrCreateIndex(mockRepo);

      const changeCallback = (mockHandle.change as any).mock.calls[0][0];
      const testDoc = { posts: {}, lastUpdated: new Date('2023-01-01') };
      changeCallback(testDoc);

      expect(testDoc.posts).toEqual({});
      expect(testDoc.lastUpdated).toBeInstanceOf(Date);
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
