import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';

/**
 * Initialize an Automerge repository with file system storage and WebSocket networking
 * @returns Promise<Repo> - Configured Automerge repository instance
 * @throws Error if storage or network adapter creation fails
 */
export async function initRepo(): Promise<Repo> {
  try {
    // Create storage adapter pointing to local data directory
    const storage = new NodeFSStorageAdapter('./autoblog-data');

    // Create network adapter for syncing with Automerge sync server
    const network = new WebSocketClientAdapter('wss://sync.automerge.org');

    // Create and return repo instance with both adapters
    const repo = new Repo({
      storage,
      network: [network],
    });

    return repo;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to initialize Automerge repository: ${message}`);
  }
}
