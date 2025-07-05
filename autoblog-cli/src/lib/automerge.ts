import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';

export type SyncSource = 'local' | 'remote';

/**
 * Initialize an Automerge repository with file system storage and optional WebSocket networking
 * @param source - The sync source to use ('local' or 'remote')
 * @returns Promise<Repo> - Configured Automerge repository instance
 * @throws Error if storage or network adapter creation fails
 */
export async function initRepo(source: SyncSource = 'remote'): Promise<Repo> {
  try {
    // Create storage adapter pointing to local data directory
    const storage = new NodeFSStorageAdapter('./autoblog-data');

    // Configure network adapter based on source
    const repoConfig: any = { storage };

    if (source === 'remote') {
      // Create network adapter for syncing with Automerge sync server
      const network = new WebSocketClientAdapter('wss://sync.automerge.org');
      repoConfig.network = [network];
    }
    // For 'local' source, no network adapter is added

    // Create and return repo instance
    const repo = new Repo(repoConfig);

    return repo;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to initialize Automerge repository: ${message}`);
  }
}
