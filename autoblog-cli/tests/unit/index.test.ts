import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getOrCreateIndex,
  updateIndex,
  findPostBySlug,
  removeFromIndex,
} from '../../src/lib/index.js';
import type { BlogIndex } from '../../src/types/index.js';

// Mock fs promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

// Mock path
vi.mock('path', () => ({
  default: {
    dirname: vi.fn(),
  },
  dirname: vi.fn(),
}));

import fs from 'fs/promises';
import path from 'path';

// Mock implementations
const mockRepo = {
  create: vi.fn(),
  find: vi.fn(),
};

const mockDocHandle = {
  documentId: 'test-index-id',
  change: vi.fn(),
  doc: vi.fn(),
  whenReady: vi.fn(),
};

describe('Index Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup doc handle mocks
    mockDocHandle.change.mockImplementation((fn) => {
      const doc = { posts: {}, lastUpdated: new Date() };
      fn(doc);
      return Promise.resolve();
    });

    mockDocHandle.doc.mockResolvedValue({
      posts: { 'test-post': 'test-doc-id' },
      lastUpdated: new Date(),
    });

    mockDocHandle.whenReady.mockResolvedValue(undefined);

    // Setup repo mocks
    mockRepo.create.mockReturnValue(mockDocHandle);
    mockRepo.find.mockResolvedValue(mockDocHandle);

    // Setup fs mocks
    vi.mocked(fs.readFile).mockResolvedValue('test-index-id');
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(path.dirname).mockReturnValue('./autoblog-data');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getOrCreateIndex', () => {
    it('should load existing index when ID file exists', async () => {
      const handle = await getOrCreateIndex(mockRepo as any);

      expect(fs.readFile).toHaveBeenCalledWith(
        './autoblog-data/index-id.txt',
        'utf-8'
      );
      expect(mockRepo.find).toHaveBeenCalledWith('test-index-id');
      expect(handle.whenReady).toHaveBeenCalled();
      expect(handle).toBe(mockDocHandle);
    });

    it('should create new index when ID file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));

      const handle = await getOrCreateIndex(mockRepo as any);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockDocHandle.change).toHaveBeenCalled();
      expect(fs.mkdir).toHaveBeenCalledWith('./autoblog-data', {
        recursive: true,
      });
      expect(fs.writeFile).toHaveBeenCalledWith(
        './autoblog-data/index-id.txt',
        'test-index-id'
      );
      expect(handle).toBe(mockDocHandle);
    });

    it('should create new index when existing index is not found', async () => {
      mockRepo.find.mockResolvedValueOnce(null);

      const handle = await getOrCreateIndex(mockRepo as any);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(handle).toBe(mockDocHandle);
    });

    it('should handle corrupted index gracefully', async () => {
      mockRepo.find.mockRejectedValueOnce(new Error('Index corrupted'));

      const handle = await getOrCreateIndex(mockRepo as any);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(handle).toBe(mockDocHandle);
    });

    it('should handle file save errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));
      vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error('Write failed'));

      const handle = await getOrCreateIndex(mockRepo as any);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(handle).toBe(mockDocHandle);
    });

    it('should handle directory creation errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));
      vi.mocked(fs.mkdir).mockRejectedValueOnce(new Error('Mkdir failed'));

      const handle = await getOrCreateIndex(mockRepo as any);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(handle).toBe(mockDocHandle);
    });

    it('should trim whitespace from index ID', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce('  test-index-id  \n');

      await getOrCreateIndex(mockRepo as any);

      expect(mockRepo.find).toHaveBeenCalledWith('test-index-id');
    });
  });

  describe('updateIndex', () => {
    it('should update index with new post', async () => {
      await updateIndex(mockDocHandle as any, 'new-post', 'new-doc-id');

      expect(mockDocHandle.change).toHaveBeenCalled();

      // Verify the change function was called with correct logic
      const changeCallback = mockDocHandle.change.mock.calls[0][0];
      const mockDoc = { posts: {}, lastUpdated: new Date() };
      changeCallback(mockDoc);

      expect(mockDoc.posts['new-post']).toBe('new-doc-id');
      expect(mockDoc.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle change errors', async () => {
      mockDocHandle.change.mockRejectedValueOnce(new Error('Change failed'));

      await expect(
        updateIndex(mockDocHandle as any, 'new-post', 'new-doc-id')
      ).rejects.toThrow('Change failed');
    });
  });

  describe('removeFromIndex', () => {
    it('should remove post from index', async () => {
      await removeFromIndex(mockDocHandle as any, 'test-post');

      expect(mockDocHandle.change).toHaveBeenCalled();

      // Verify the change function was called with correct logic
      const changeCallback = mockDocHandle.change.mock.calls[0][0];
      const mockDoc = {
        posts: { 'test-post': 'test-doc-id' },
        lastUpdated: new Date(),
      };
      changeCallback(mockDoc);

      expect(mockDoc.posts['test-post']).toBeUndefined();
      expect(mockDoc.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle change errors', async () => {
      mockDocHandle.change.mockRejectedValueOnce(new Error('Change failed'));

      await expect(
        removeFromIndex(mockDocHandle as any, 'test-post')
      ).rejects.toThrow('Change failed');
    });
  });

  describe('findPostBySlug', () => {
    it('should find post by slug', async () => {
      const result = await findPostBySlug(mockDocHandle as any, 'test-post');

      expect(mockDocHandle.doc).toHaveBeenCalled();
      expect(result).toBe('test-doc-id');
    });

    it('should return null when post not found', async () => {
      mockDocHandle.doc.mockResolvedValueOnce({
        posts: {},
        lastUpdated: new Date(),
      });

      const result = await findPostBySlug(
        mockDocHandle as any,
        'nonexistent-post'
      );

      expect(result).toBeNull();
    });

    it('should return null when index is null', async () => {
      mockDocHandle.doc.mockResolvedValueOnce(null);

      const result = await findPostBySlug(mockDocHandle as any, 'test-post');

      expect(result).toBeNull();
    });

    it('should handle doc retrieval errors', async () => {
      mockDocHandle.doc.mockRejectedValueOnce(
        new Error('Doc retrieval failed')
      );

      await expect(
        findPostBySlug(mockDocHandle as any, 'test-post')
      ).rejects.toThrow('Doc retrieval failed');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete index lifecycle', async () => {
      // Force creation of new index by making file read fail
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));

      // Create index
      const handle = await getOrCreateIndex(mockRepo as any);

      // Add post
      await updateIndex(handle, 'first-post', 'first-doc-id');

      // Update mock to return the post we just added
      mockDocHandle.doc.mockResolvedValueOnce({
        posts: { 'first-post': 'first-doc-id' },
        lastUpdated: new Date(),
      });

      // Find post
      const docId = await findPostBySlug(handle, 'first-post');
      expect(docId).toBe('first-doc-id');

      // Remove post
      await removeFromIndex(handle, 'first-post');

      // Verify all operations completed
      expect(mockDocHandle.change).toHaveBeenCalledTimes(3); // Create, update, remove
    });

    it('should handle multiple posts in index', async () => {
      mockDocHandle.doc.mockResolvedValue({
        posts: {
          'post-1': 'doc-1',
          'post-2': 'doc-2',
          'post-3': 'doc-3',
        },
        lastUpdated: new Date(),
      });

      const handle = await getOrCreateIndex(mockRepo as any);

      const result1 = await findPostBySlug(handle, 'post-1');
      const result2 = await findPostBySlug(handle, 'post-2');
      const result3 = await findPostBySlug(handle, 'post-3');
      const result4 = await findPostBySlug(handle, 'nonexistent');

      expect(result1).toBe('doc-1');
      expect(result2).toBe('doc-2');
      expect(result3).toBe('doc-3');
      expect(result4).toBeNull();
    });
  });
});
