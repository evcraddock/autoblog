import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initRepo,
  uploadBlogPost,
  listBlogPosts,
  deleteBlogPost,
} from '../../src/lib/automerge.js';
import * as indexModule from '../../src/lib/index.js';
import type { BlogPost, BlogIndex } from '../../src/types/index.js';

// Mock external dependencies
vi.mock('@automerge/automerge-repo', () => ({
  Repo: vi.fn(),
}));

vi.mock('@automerge/automerge-repo-storage-nodefs', () => ({
  NodeFSStorageAdapter: vi.fn(),
}));

vi.mock('@automerge/automerge-repo-network-websocket', () => ({
  WebSocketClientAdapter: vi.fn(),
}));

// Mock the index module functions
vi.mock('../../src/lib/index.js', () => ({
  getOrCreateIndex: vi.fn(),
  updateIndex: vi.fn(),
  findPostBySlug: vi.fn(),
  removeFromIndex: vi.fn(),
}));

// Mock the config module
vi.mock('../../src/lib/config.js', () => ({
  getConfigManager: vi.fn(() => ({
    loadConfig: vi.fn(),
  })),
}));

// Import mocked modules
import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { getConfigManager } from '../../src/lib/config.js';

// Mock implementations
const mockRepo = {
  create: vi.fn(),
  find: vi.fn(),
};

const mockDocHandle = {
  documentId: 'test-doc-id',
  change: vi.fn(),
  doc: vi.fn(),
  whenReady: vi.fn(),
};

const mockIndexHandle = {
  documentId: 'test-index-id',
  change: vi.fn(),
  doc: vi.fn(),
  whenReady: vi.fn(),
};

describe('Automerge Module', () => {
  const mockConfigManager = {
    loadConfig: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup config mock
    (getConfigManager as any).mockReturnValue(mockConfigManager);
    mockConfigManager.loadConfig.mockResolvedValue({
      storage: { dataPath: './autoblog-data' },
      network: { syncUrl: 'wss://sync.automerge.org' },
      sync: { defaultSource: 'all' },
    });

    // Setup basic mocks
    vi.mocked(NodeFSStorageAdapter).mockImplementation(
      () =>
        ({
          path: './autoblog-data',
          type: 'NodeFSStorageAdapter',
        }) as any
    );

    vi.mocked(WebSocketClientAdapter).mockImplementation(
      () =>
        ({
          url: 'wss://sync.automerge.org',
          type: 'WebSocketClientAdapter',
        }) as any
    );

    vi.mocked(Repo).mockImplementation(() => mockRepo as any);

    // Setup doc handle mocks
    mockDocHandle.change.mockImplementation((fn) => {
      const doc = {};
      fn(doc);
      return Promise.resolve();
    });

    mockDocHandle.doc.mockResolvedValue({
      title: 'Test Post',
      author: 'Test Author',
      published: new Date('2023-01-01'),
      status: 'published',
      slug: 'test-post',
      description: 'Test description',
      content: 'Test content',
    });

    mockDocHandle.whenReady.mockResolvedValue(undefined);

    // Setup index handle mocks
    mockIndexHandle.change.mockImplementation((fn) => {
      const doc = { posts: {}, lastUpdated: new Date() };
      fn(doc);
      return Promise.resolve();
    });

    mockIndexHandle.doc.mockResolvedValue({
      posts: { 'test-post': 'test-doc-id' },
      lastUpdated: new Date(),
    });

    mockIndexHandle.whenReady.mockResolvedValue(undefined);

    // Setup repo mocks
    mockRepo.create.mockReturnValue(mockDocHandle);
    mockRepo.find.mockResolvedValue(mockDocHandle);

    // Setup index module mocks
    vi.mocked(indexModule.getOrCreateIndex).mockResolvedValue(
      mockIndexHandle as any
    );
    vi.mocked(indexModule.updateIndex).mockResolvedValue(undefined);
    vi.mocked(indexModule.findPostBySlug).mockResolvedValue('test-doc-id');
    vi.mocked(indexModule.removeFromIndex).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initRepo', () => {
    it('should create repo with storage adapter', async () => {
      const repo = await initRepo();

      expect(NodeFSStorageAdapter).toHaveBeenCalledWith('./autoblog-data');
      expect(Repo).toHaveBeenCalledWith({
        storage: expect.objectContaining({
          path: './autoblog-data',
          type: 'NodeFSStorageAdapter',
        }),
        network: [
          expect.objectContaining({
            url: 'wss://sync.automerge.org',
            type: 'WebSocketClientAdapter',
          }),
        ],
      });
      expect(repo).toBeDefined();
    });

    it('should create repo with local source (no network)', async () => {
      await initRepo('local');

      expect(WebSocketClientAdapter).not.toHaveBeenCalled();
      expect(Repo).toHaveBeenCalledWith({
        storage: expect.objectContaining({
          path: './autoblog-data',
          type: 'NodeFSStorageAdapter',
        }),
      });
    });

    it('should handle initialization errors', async () => {
      vi.mocked(NodeFSStorageAdapter).mockImplementationOnce(() => {
        throw new Error('Storage failed');
      });

      await expect(initRepo()).rejects.toThrow(
        'Failed to initialize Automerge repository: Storage failed'
      );
    });
  });

  describe('uploadBlogPost', () => {
    const mockBlogPost: Partial<BlogPost> = {
      title: 'Test Post',
      author: 'Test Author',
      published: new Date('2023-01-01'),
      status: 'published',
      slug: 'test-post',
      description: 'Test description',
      content: 'Test content',
    };

    it('should upload blog post successfully', async () => {
      const documentId = await uploadBlogPost(mockBlogPost);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockDocHandle.change).toHaveBeenCalled();
      expect(indexModule.getOrCreateIndex).toHaveBeenCalled();
      expect(indexModule.updateIndex).toHaveBeenCalledWith(
        mockIndexHandle,
        'test-post',
        'test-doc-id'
      );
      expect(documentId).toBe('test-doc-id');
    });

    it('should handle upload errors', async () => {
      mockRepo.create.mockImplementationOnce(() => {
        throw new Error('Create failed');
      });

      await expect(uploadBlogPost(mockBlogPost)).rejects.toThrow(
        'Failed to upload blog post: Create failed'
      );
    });

    it('should handle index update errors', async () => {
      vi.mocked(indexModule.updateIndex).mockRejectedValueOnce(
        new Error('Index update failed')
      );

      await expect(uploadBlogPost(mockBlogPost)).rejects.toThrow(
        'Failed to upload blog post: Index update failed'
      );
    });
  });

  describe('listBlogPosts', () => {
    it('should list blog posts successfully', async () => {
      const posts = await listBlogPosts();

      expect(indexModule.getOrCreateIndex).toHaveBeenCalled();
      expect(mockIndexHandle.doc).toHaveBeenCalled();
      expect(mockRepo.find).toHaveBeenCalledWith('test-doc-id');
      expect(posts).toHaveLength(1);
      expect(posts[0]).toEqual(
        expect.objectContaining({
          title: 'Test Post',
          slug: 'test-post',
        })
      );
    });

    it('should return empty array when no posts exist', async () => {
      mockIndexHandle.doc.mockResolvedValueOnce({
        posts: {},
        lastUpdated: new Date(),
      });

      const posts = await listBlogPosts();

      expect(posts).toEqual([]);
    });

    it('should handle missing index', async () => {
      mockIndexHandle.doc.mockResolvedValueOnce(null);

      const posts = await listBlogPosts();

      expect(posts).toEqual([]);
    });

    it('should skip posts that fail to load', async () => {
      mockIndexHandle.doc.mockResolvedValueOnce({
        posts: {
          'valid-post': 'valid-doc-id',
          'invalid-post': 'invalid-doc-id',
        },
        lastUpdated: new Date(),
      });

      mockRepo.find
        .mockResolvedValueOnce(mockDocHandle) // First call succeeds
        .mockResolvedValueOnce(null); // Second call fails

      const posts = await listBlogPosts();

      expect(posts).toHaveLength(1);
      expect(posts[0].slug).toBe('test-post');
    });

    it('should sort posts by published date (newest first)', async () => {
      const olderPost = {
        ...mockDocHandle,
        doc: vi.fn().mockResolvedValue({
          title: 'Older Post',
          published: new Date('2022-01-01'),
          slug: 'older-post',
        }),
      };

      const newerPost = {
        ...mockDocHandle,
        doc: vi.fn().mockResolvedValue({
          title: 'Newer Post',
          published: new Date('2024-01-01'),
          slug: 'newer-post',
        }),
      };

      mockIndexHandle.doc.mockResolvedValueOnce({
        posts: {
          'older-post': 'older-doc-id',
          'newer-post': 'newer-doc-id',
        },
        lastUpdated: new Date(),
      });

      mockRepo.find
        .mockResolvedValueOnce(olderPost)
        .mockResolvedValueOnce(newerPost);

      const posts = await listBlogPosts();

      expect(posts).toHaveLength(2);
      expect(posts[0].slug).toBe('newer-post');
      expect(posts[1].slug).toBe('older-post');
    });

    it('should handle listing errors', async () => {
      vi.mocked(indexModule.getOrCreateIndex).mockRejectedValueOnce(
        new Error('Index access failed')
      );

      await expect(listBlogPosts()).rejects.toThrow(
        'Failed to list blog posts: Index access failed'
      );
    });
  });

  describe('deleteBlogPost', () => {
    it('should delete blog post successfully', async () => {
      const result = await deleteBlogPost('test-post');

      expect(indexModule.getOrCreateIndex).toHaveBeenCalled();
      expect(indexModule.findPostBySlug).toHaveBeenCalledWith(
        mockIndexHandle,
        'test-post'
      );
      expect(mockRepo.find).toHaveBeenCalledWith('test-doc-id');
      expect(indexModule.removeFromIndex).toHaveBeenCalledWith(
        mockIndexHandle,
        'test-post'
      );
      expect(result).toBe(true);
    });

    it('should return false when post not found', async () => {
      vi.mocked(indexModule.findPostBySlug).mockResolvedValueOnce(null);

      const result = await deleteBlogPost('nonexistent-post');

      expect(result).toBe(false);
      expect(indexModule.removeFromIndex).not.toHaveBeenCalled();
    });

    it('should handle post document verification failure gracefully', async () => {
      mockRepo.find.mockResolvedValueOnce(null);

      const result = await deleteBlogPost('test-post');

      expect(result).toBe(true);
      expect(indexModule.removeFromIndex).toHaveBeenCalled();
    });

    it('should handle index removal failure gracefully', async () => {
      vi.mocked(indexModule.removeFromIndex).mockRejectedValueOnce(
        new Error('Index removal failed')
      );

      const result = await deleteBlogPost('test-post');

      expect(result).toBe(true);
    });

    it('should handle deletion errors', async () => {
      vi.mocked(indexModule.getOrCreateIndex).mockRejectedValueOnce(
        new Error('Index access failed')
      );

      await expect(deleteBlogPost('test-post')).rejects.toThrow(
        'Failed to delete blog post: Index access failed'
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete upload-list-delete workflow', async () => {
      const mockBlogPost: Partial<BlogPost> = {
        title: 'Workflow Test',
        author: 'Test Author',
        published: new Date('2023-01-01'),
        status: 'published',
        slug: 'workflow-test',
        description: 'Test workflow',
        content: 'Test content',
      };

      // Upload
      const documentId = await uploadBlogPost(mockBlogPost);
      expect(documentId).toBe('test-doc-id');

      // List
      const posts = await listBlogPosts();
      expect(posts).toHaveLength(1);

      // Delete
      const deleted = await deleteBlogPost('workflow-test');
      expect(deleted).toBe(true);
    });

    it('should handle multiple posts with different sync sources', async () => {
      const localPost: Partial<BlogPost> = {
        title: 'Local Post',
        slug: 'local-post',
        content: 'Local content',
      };

      const remotePost: Partial<BlogPost> = {
        title: 'Remote Post',
        slug: 'remote-post',
        content: 'Remote content',
      };

      await uploadBlogPost(localPost, 'local');
      await uploadBlogPost(remotePost, 'remote');

      const localPosts = await listBlogPosts('local');
      const remotePosts = await listBlogPosts('remote');

      expect(localPosts).toHaveLength(1);
      expect(remotePosts).toHaveLength(1);
    });
  });
});
