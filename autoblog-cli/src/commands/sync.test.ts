import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { syncCommand } from './sync.js';
import * as automergeLib from '../lib/automerge.js';
import chalk from 'chalk';

vi.mock('../lib/automerge.js');
vi.mock('chalk', () => ({
  default: {
    blue: (str: string) => `BLUE: ${str}`,
    green: (str: string) => `GREEN: ${str}`,
    yellow: (str: string) => `YELLOW: ${str}`,
    red: (str: string) => `RED: ${str}`,
    gray: (str: string) => `GRAY: ${str}`,
    bold: {
      green: (str: string) => `BOLD_GREEN: ${str}`,
      blue: (str: string) => `BOLD_BLUE: ${str}`,
    },
  },
}));

describe('Sync Command', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let mockRepo: any;
  let mockNetworkAdapter: any;

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

    // Mock network adapter
    mockNetworkAdapter = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      sync: vi.fn().mockResolvedValue(undefined),
    };

    // Mock repo with sync capabilities
    mockRepo = {
      documents: ['doc-1', 'doc-2', 'doc-3'],
      networkSubsystem: {
        adapters: [mockNetworkAdapter],
        isOnline: vi.fn().mockReturnValue(true),
      },
      storageSubsystem: {
        save: vi.fn().mockResolvedValue(undefined),
      },
      sync: vi.fn().mockResolvedValue({
        documentsCount: 3,
        bytesTransferred: 1024,
        errors: [],
      }),
      getAllDocuments: vi.fn().mockReturnValue(['doc-1', 'doc-2', 'doc-3']),
    };

    vi.mocked(automergeLib.initRepo).mockResolvedValue(mockRepo);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should successfully sync all documents', async () => {
    await syncCommand();
    vi.runAllTimers();

    // Check that the sync process started
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('BLUE: 🔄 Starting manual synchronization...')
    );

    // Check that sync completed successfully
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('✅ Sync completed successfully!')
    );

    // Check that statistics were displayed
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Documents synced: 3')
    );

    // Check connection status
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Connection status: ✅ Online')
    );

    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle offline network status', async () => {
    mockRepo.networkSubsystem.isOnline.mockReturnValue(false);
    mockNetworkAdapter.isConnected.mockReturnValue(false);

    await syncCommand();
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('BLUE: 🔄 Starting manual synchronization...')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Connection status: ❌ Offline')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('⚠️  Network is offline')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle sync errors gracefully', async () => {
    const syncError = new Error('Network timeout');
    mockRepo.sync.mockRejectedValue(syncError);

    await syncCommand();
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('BLUE: 🔄 Starting manual synchronization...')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌ Sync operation failed: Network timeout')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle zero documents to sync', async () => {
    mockRepo._mockSyncResult = {
      documentsCount: 0,
      bytesTransferred: 0,
      errors: [],
    };

    await syncCommand();
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Documents synced: 0')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Data transferred: 0.00 KB')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('No documents found to sync')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should format bytes correctly for different sizes', async () => {
    // Test different byte sizes based on actual implementation behavior
    const testCases = [
      { bytes: 0, expected: '0.00 KB' },
      { bytes: 512, expected: '512.00 bytes' },
      { bytes: 1024, expected: '1.00 KB' },
      { bytes: 1536, expected: '1.50 KB' },
      { bytes: 1048576, expected: '1.00 MB' },
      { bytes: 1073741824, expected: '1.00 GB' },
    ];

    for (const testCase of testCases) {
      vi.clearAllMocks();

      // Use mock sync result for precise control over bytes
      mockRepo._mockSyncResult = {
        documentsCount: 1,
        bytesTransferred: testCase.bytes,
        errors: [],
      };

      await syncCommand();
      vi.runAllTimers();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Data transferred: ${testCase.expected}`)
      );
    }
  });

  it('should handle partial sync failures', async () => {
    mockRepo._mockSyncResult = {
      documentsCount: 2,
      bytesTransferred: 512,
      errors: ['Failed to sync doc-1', 'Network error for doc-2'],
    };

    await syncCommand();
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('✅ Sync completed successfully!')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Documents synced: 2')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('⚠️  Some documents had sync issues:')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to sync doc-1')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Network error for doc-2')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle initialization errors', async () => {
    vi.mocked(automergeLib.initRepo).mockRejectedValue(
      new Error('Init failed')
    );

    await expect(syncCommand()).rejects.toThrow('Sync failed: Init failed');
  });

  it('should show progress during sync operation', async () => {
    // Simple test without timeout issues
    await syncCommand();
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('BLUE: 🔄 Starting manual synchronization...')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('GRAY: Checking network connection...')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('GRAY: Syncing documents...')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle network adapter connection errors', async () => {
    mockNetworkAdapter.connect.mockRejectedValue(
      new Error('Connection failed')
    );
    mockRepo.networkSubsystem.isOnline.mockReturnValue(false);

    await syncCommand();
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Connection status: ❌ Offline')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('⚠️  Network is offline')
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });
});
