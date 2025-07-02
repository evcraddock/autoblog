import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock console methods first
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`process.exit unexpectedly called with "${code}"`);
});

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    blue: vi.fn((text: string) => `BLUE: ${text}`),
    red: vi.fn((text: string) => `RED: ${text}`),
  },
}));

// Mock commander
const mockCommand = {
  name: vi.fn().mockReturnThis(),
  description: vi.fn().mockReturnThis(),
  version: vi.fn().mockReturnThis(),
  command: vi.fn().mockReturnThis(),
  action: vi.fn().mockReturnThis(),
  parse: vi.fn(),
};

vi.mock('commander', () => ({
  Command: vi.fn(() => mockCommand),
}));

// Mock the upload command module
vi.mock('../../src/commands/upload.js', () => ({
  uploadCommand: vi.fn(),
}));

describe('CLI Entry Point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  it('should configure program with correct name, description, and version', async () => {
    await import('../../src/index.js');

    expect(mockCommand.name).toHaveBeenCalledWith('autoblog');
    expect(mockCommand.description).toHaveBeenCalledWith(
      'CLI tool for Automerge-powered blog'
    );
    expect(mockCommand.version).toHaveBeenCalledWith('0.1.0');
  });

  it('should register upload command and call parse', async () => {
    await import('../../src/index.js');

    expect(mockCommand.command).toHaveBeenCalledWith('upload <file>');
    expect(mockCommand.description).toHaveBeenCalledWith(
      'Upload a markdown file to the blog'
    );
    expect(mockCommand.action).toHaveBeenCalled();
    expect(mockCommand.parse).toHaveBeenCalled();
  });

  it('should handle upload command action correctly', async () => {
    const { uploadCommand } = await import('../../src/commands/upload.js');
    let capturedAction: (file: string) => Promise<void>;

    mockCommand.action.mockImplementation(
      (action: (file: string) => Promise<void>) => {
        capturedAction = action;
        return mockCommand;
      }
    );

    await import('../../src/index.js');

    const testFile = 'test-post.md';
    await capturedAction!(testFile);

    expect(uploadCommand).toHaveBeenCalledWith(testFile);
  });

  it('should handle uncaught exceptions gracefully', async () => {
    const chalk = await import('chalk');
    await import('../../src/index.js');

    const testError = new Error('Test uncaught exception');

    expect(() => {
      process.emit('uncaughtException', testError);
    }).toThrow('process.exit unexpectedly called with "1"');

    expect(chalk.default.red).toHaveBeenCalledWith(
      'Uncaught Exception:',
      'Test uncaught exception'
    );
  });

  it('should handle unhandled rejections gracefully', async () => {
    const chalk = await import('chalk');
    await import('../../src/index.js');

    const testReason = 'Test unhandled rejection';

    expect(() => {
      process.emit('unhandledRejection', testReason);
    }).toThrow('process.exit unexpectedly called with "1"');

    expect(chalk.default.red).toHaveBeenCalledWith(
      'Unhandled Rejection:',
      testReason
    );
  });
});
