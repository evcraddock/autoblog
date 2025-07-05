import { next as A } from '@automerge/automerge';
import type { DocHandle } from '@automerge/automerge-repo';

export interface DocumentOriginInfo {
  originatedLocally: boolean;
  firstActorId: string;
  createdAt: number;
  totalActors: number;
  totalChanges: number;
  syncStatus: 'local' | 'synced' | 'unknown';
}

/**
 * Analyze document origin and collaboration metadata
 */
export async function analyzeDocumentOrigin<T>(
  handle: DocHandle<T>
): Promise<DocumentOriginInfo> {
  try {
    await handle.whenReady();
    const doc = await handle.doc();

    if (!doc) {
      return {
        originatedLocally: false,
        firstActorId: 'unknown',
        createdAt: 0,
        totalActors: 0,
        totalChanges: 0,
        syncStatus: 'unknown',
      };
    }

    // Get document metadata that's available
    const currentActorId = A.getActorId(doc);
    const allChanges = A.getAllChanges(doc);

    // For now, use a simpler heuristic for origin detection
    // TODO: Implement proper change inspection when API mismatch is resolved

    // Use change count and current actor as a simple heuristic
    const totalChanges = allChanges.length;

    // If there are very few changes and we have a current actor, assume local
    // This is a simplified heuristic until proper change inspection works
    let syncStatus: 'local' | 'synced' | 'unknown';
    let originatedLocally = false;

    if (totalChanges === 0) {
      syncStatus = 'unknown';
    } else if (totalChanges <= 2 && currentActorId) {
      // Assumption: very new documents with few changes are likely local
      syncStatus = 'local';
      originatedLocally = true;
    } else {
      // For documents with more changes, we can't determine origin reliably
      // without proper change inspection, so mark as unknown for now
      syncStatus = 'unknown';
    }

    return {
      originatedLocally,
      firstActorId: currentActorId.slice(0, 8), // Use current actor as fallback
      createdAt: Date.now(), // Fallback timestamp
      totalActors: 1, // We only know about current actor
      totalChanges,
      syncStatus,
    };
  } catch (error) {
    // If analysis fails, return default values
    return {
      originatedLocally: false,
      firstActorId: 'error',
      createdAt: 0,
      totalActors: 0,
      totalChanges: 0,
      syncStatus: 'unknown',
    };
  }
}

/**
 * Format origin info for display
 */
export function formatOriginInfo(origin: DocumentOriginInfo): string {
  const statusEmoji = {
    local: '📝',
    synced: '🔄',
    unknown: '❓',
  };

  const emoji = statusEmoji[origin.syncStatus];
  const suffix =
    origin.totalActors > 1 ? ` (${origin.totalActors} authors)` : '';

  return `${emoji} ${origin.syncStatus}${suffix}`;
}

/**
 * Get a short description of document origin
 */
export function getOriginDescription(origin: DocumentOriginInfo): string {
  if (origin.syncStatus === 'local') {
    return 'Created locally';
  } else if (origin.syncStatus === 'synced') {
    if (origin.originatedLocally) {
      return `Local document synced to ${origin.totalActors} device${origin.totalActors > 1 ? 's' : ''}`;
    } else {
      return `Synced from remote (${origin.firstActorId})`;
    }
  } else {
    return 'Origin unknown';
  }
}
