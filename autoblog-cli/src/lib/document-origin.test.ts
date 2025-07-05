import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  analyzeDocumentOrigin,
  formatOriginInfo,
  getOriginDescription,
} from './document-origin.js';
import { next as A } from '@automerge/automerge';

// Mock @automerge/automerge
vi.mock('@automerge/automerge', () => ({
  next: {
    getHistory: vi.fn(),
    getAllChanges: vi.fn(),
    getActorId: vi.fn(),
    inspectChange: vi.fn(),
  },
}));

describe('Document Origin Analysis', () => {
  let mockHandle: any;
  let mockDoc: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDoc = {
      title: 'Test Post',
      content: 'Test content',
    };

    mockHandle = {
      whenReady: vi.fn().mockResolvedValue(undefined),
      doc: vi.fn().mockResolvedValue(mockDoc),
    };

    // Default mock implementations
    vi.mocked(A.getActorId).mockReturnValue('actor123');
    vi.mocked(A.getHistory).mockReturnValue([]);
    vi.mocked(A.getAllChanges).mockReturnValue([]);
    vi.mocked(A.inspectChange).mockReturnValue(null);
  });

  describe('analyzeDocumentOrigin', () => {
    it('should handle documents with no changes', async () => {
      vi.mocked(A.getAllChanges).mockReturnValue([]);
      vi.mocked(A.getActorId).mockReturnValue('actor123');

      const result = await analyzeDocumentOrigin(mockHandle);

      expect(result.originatedLocally).toBe(false);
      expect(result.totalChanges).toBe(0);
      expect(result.syncStatus).toBe('unknown');
      expect(result.firstActorId).toBe('actor123');
      expect(result.totalActors).toBe(1);
      expect(result.createdAt).toBeGreaterThan(0); // Should be current timestamp
    });

    it('should identify locally originated documents', async () => {
      const currentActorId = 'actor123';
      const mockChange = new Uint8Array([1, 2, 3, 4]); // Mock binary change

      vi.mocked(A.getActorId).mockReturnValue(currentActorId);
      vi.mocked(A.getAllChanges).mockReturnValue([mockChange]); // 1 change, should be local

      const result = await analyzeDocumentOrigin(mockHandle);

      expect(result.originatedLocally).toBe(true);
      expect(result.firstActorId).toBe('actor123');
      expect(result.totalActors).toBe(1);
      expect(result.totalChanges).toBe(1);
      expect(result.syncStatus).toBe('local');
      expect(result.createdAt).toBeGreaterThan(0); // Should be current timestamp
    });

    it('should identify documents with many changes as unknown', async () => {
      const currentActorId = 'actor123';
      const mockChanges = [
        new Uint8Array([1, 2, 3, 4]),
        new Uint8Array([5, 6, 7, 8]),
        new Uint8Array([9, 10, 11, 12]),
      ]; // 3 changes, should be unknown with current heuristic

      vi.mocked(A.getActorId).mockReturnValue(currentActorId);
      vi.mocked(A.getAllChanges).mockReturnValue(mockChanges);

      const result = await analyzeDocumentOrigin(mockHandle);

      expect(result.originatedLocally).toBe(false);
      expect(result.firstActorId).toBe('actor123');
      expect(result.totalActors).toBe(1);
      expect(result.totalChanges).toBe(3);
      expect(result.syncStatus).toBe('unknown'); // More than 2 changes = unknown
      expect(result.createdAt).toBeGreaterThan(0);
    });

    it('should identify documents with 2 changes as local', async () => {
      const currentActorId = 'actor1';
      const mockChanges = [
        new Uint8Array([1, 2, 3, 4]),
        new Uint8Array([5, 6, 7, 8]),
      ]; // 2 changes, should be local with current heuristic

      vi.mocked(A.getActorId).mockReturnValue(currentActorId);
      vi.mocked(A.getAllChanges).mockReturnValue(mockChanges);

      const result = await analyzeDocumentOrigin(mockHandle);

      expect(result.originatedLocally).toBe(true);
      expect(result.firstActorId).toBe('actor1');
      expect(result.totalActors).toBe(1);
      expect(result.totalChanges).toBe(2);
      expect(result.syncStatus).toBe('local'); // 2 changes = still local
      expect(result.createdAt).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      mockHandle.whenReady.mockRejectedValue(new Error('Network error'));

      const result = await analyzeDocumentOrigin(mockHandle);

      expect(result).toEqual({
        originatedLocally: false,
        firstActorId: 'error',
        createdAt: 0,
        totalActors: 0,
        totalChanges: 0,
        syncStatus: 'unknown',
      });
    });

    it('should handle null document', async () => {
      mockHandle.doc.mockResolvedValue(null);

      const result = await analyzeDocumentOrigin(mockHandle);

      expect(result).toEqual({
        originatedLocally: false,
        firstActorId: 'unknown',
        createdAt: 0,
        totalActors: 0,
        totalChanges: 0,
        syncStatus: 'unknown',
      });
    });
  });

  describe('formatOriginInfo', () => {
    it('should format local documents', () => {
      const origin = {
        originatedLocally: true,
        firstActorId: 'actor123',
        createdAt: Date.now(),
        totalActors: 1,
        totalChanges: 1,
        syncStatus: 'local' as const,
      };

      const result = formatOriginInfo(origin);
      expect(result).toBe('📝 local');
    });

    it('should format synced documents', () => {
      const origin = {
        originatedLocally: false,
        firstActorId: 'remote12',
        createdAt: Date.now(),
        totalActors: 2,
        totalChanges: 5,
        syncStatus: 'synced' as const,
      };

      const result = formatOriginInfo(origin);
      expect(result).toBe('🔄 synced (2 authors)');
    });

    it('should format unknown documents', () => {
      const origin = {
        originatedLocally: false,
        firstActorId: 'unknown',
        createdAt: 0,
        totalActors: 0,
        totalChanges: 0,
        syncStatus: 'unknown' as const,
      };

      const result = formatOriginInfo(origin);
      expect(result).toBe('❓ unknown');
    });
  });

  describe('getOriginDescription', () => {
    it('should describe local documents', () => {
      const origin = {
        originatedLocally: true,
        firstActorId: 'actor123',
        createdAt: Date.now(),
        totalActors: 1,
        totalChanges: 1,
        syncStatus: 'local' as const,
      };

      const result = getOriginDescription(origin);
      expect(result).toBe('Created locally');
    });

    it('should describe local documents synced to multiple devices', () => {
      const origin = {
        originatedLocally: true,
        firstActorId: 'actor123',
        createdAt: Date.now(),
        totalActors: 3,
        totalChanges: 5,
        syncStatus: 'synced' as const,
      };

      const result = getOriginDescription(origin);
      expect(result).toBe('Local document synced to 3 devices');
    });

    it('should describe remote documents', () => {
      const origin = {
        originatedLocally: false,
        firstActorId: 'remote12',
        createdAt: Date.now(),
        totalActors: 2,
        totalChanges: 3,
        syncStatus: 'synced' as const,
      };

      const result = getOriginDescription(origin);
      expect(result).toBe('Synced from remote (remote12)');
    });

    it('should describe unknown documents', () => {
      const origin = {
        originatedLocally: false,
        firstActorId: 'unknown',
        createdAt: 0,
        totalActors: 0,
        totalChanges: 0,
        syncStatus: 'unknown' as const,
      };

      const result = getOriginDescription(origin);
      expect(result).toBe('Origin unknown');
    });
  });
});
