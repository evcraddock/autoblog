import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initRepo } from '../../src/lib/automerge.js';

// Mock the Automerge dependencies
vi.mock('@automerge/automerge-repo', () => ({
  Repo: vi.fn(),
}));

vi.mock('@automerge/automerge-repo-storage-nodefs', () => ({
  NodeFSStorageAdapter: vi.fn(),
}));

vi.mock('@automerge/automerge-repo-network-websocket', () => ({
  WebSocketClientAdapter: vi.fn(),
}));

// Import the mocked modules for type checking
import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';

describe('Automerge Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock implementations
    vi.mocked(NodeFSStorageAdapter).mockImplementation((path: string) => {
      return {
        path,
        type: 'NodeFSStorageAdapter',
      } as any;
    });

    vi.mocked(WebSocketClientAdapter).mockImplementation((url: string) => {
      return {
        url,
        type: 'WebSocketClientAdapter',
      } as any;
    });

    vi.mocked(Repo).mockImplementation((config: any) => {
      return {
        storage: config.storage,
        network: config.network,
      } as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initRepo function', () => {
    it('should create NodeFSStorageAdapter with correct path', async () => {
      await initRepo();

      expect(NodeFSStorageAdapter).toHaveBeenCalledWith('./autoblog-data');
      expect(NodeFSStorageAdapter).toHaveBeenCalledTimes(1);
    });

    it('should create WebSocketClientAdapter with correct URL', async () => {
      await initRepo();

      expect(WebSocketClientAdapter).toHaveBeenCalledWith(
        'wss://sync.automerge.org'
      );
      expect(WebSocketClientAdapter).toHaveBeenCalledTimes(1);
    });

    it('should create Repo with both storage and network adapters', async () => {
      await initRepo();

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
      expect(Repo).toHaveBeenCalledTimes(1);
    });

    it('should return a Repo instance', async () => {
      const repo = await initRepo();

      expect(repo).toBeDefined();
      expect(typeof repo).toBe('object');
    });

    it('should handle storage adapter creation failures', async () => {
      // Mock NodeFSStorageAdapter to throw an error
      vi.mocked(NodeFSStorageAdapter).mockImplementationOnce(() => {
        throw new Error('Storage initialization failed');
      });

      await expect(initRepo()).rejects.toThrow(
        'Failed to initialize Automerge repository: Storage initialization failed'
      );
    });

    it('should handle network adapter creation failures', async () => {
      // Mock WebSocketClientAdapter to throw an error
      vi.mocked(WebSocketClientAdapter).mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      await expect(initRepo()).rejects.toThrow(
        'Failed to initialize Automerge repository: Network connection failed'
      );
    });

    it('should handle Repo instantiation failures', async () => {
      // Mock Repo constructor to throw an error
      vi.mocked(Repo).mockImplementationOnce(() => {
        throw new Error('Repo creation failed');
      });

      await expect(initRepo()).rejects.toThrow(
        'Failed to initialize Automerge repository: Repo creation failed'
      );
    });

    it('should handle unknown errors gracefully', async () => {
      // Mock Repo constructor to throw a non-Error object
      vi.mocked(Repo).mockImplementationOnce(() => {
        throw 'String error'; // eslint-disable-line no-throw-literal
      });

      await expect(initRepo()).rejects.toThrow(
        'Failed to initialize Automerge repository: Unknown error occurred'
      );
    });

    it('should create adapters in the correct order', async () => {
      const calls: string[] = [];

      vi.mocked(NodeFSStorageAdapter).mockImplementationOnce((path) => {
        calls.push('storage');
        return { path, type: 'NodeFSStorageAdapter' };
      });

      vi.mocked(WebSocketClientAdapter).mockImplementationOnce((url) => {
        calls.push('network');
        return { url, type: 'WebSocketClientAdapter' };
      });

      vi.mocked(Repo).mockImplementationOnce((config) => {
        calls.push('repo');
        return { config, storage: config.storage, network: config.network };
      });

      await initRepo();

      expect(calls).toEqual(['storage', 'network', 'repo']);
    });

    it('should pass network adapter as array to Repo', async () => {
      await initRepo();

      const repoCall = vi.mocked(Repo).mock.calls[0][0];
      expect(Array.isArray(repoCall.network)).toBe(true);
      expect(repoCall.network).toHaveLength(1);
    });
  });

  describe('Configuration verification', () => {
    it('should use correct storage path for autoblog data', async () => {
      await initRepo();

      const storageCall = vi.mocked(NodeFSStorageAdapter).mock.calls[0];
      expect(storageCall[0]).toBe('./autoblog-data');
    });

    it('should use correct WebSocket URL for Automerge sync server', async () => {
      await initRepo();

      const networkCall = vi.mocked(WebSocketClientAdapter).mock.calls[0];
      expect(networkCall[0]).toBe('wss://sync.automerge.org');
    });
  });
});
