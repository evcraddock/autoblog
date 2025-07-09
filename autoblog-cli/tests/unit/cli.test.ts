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
  option: vi.fn().mockReturnThis(),
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

// Mock the list command module
vi.mock('../../src/commands/list.js', () => ({
  listCommand: vi.fn(),
}));

// Mock the delete command module
vi.mock('../../src/commands/delete.js', () => ({
  deleteCommand: vi.fn(),
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
    let capturedActions: { [key: string]: Function } = {};

    mockCommand.command.mockImplementation((cmd: string) => {
      return mockCommand;
    });

    mockCommand.action.mockImplementation((action: Function) => {
      // Store actions by command name
      const lastCommand =
        mockCommand.command.mock.calls[
          mockCommand.command.mock.calls.length - 1
        ][0];
      const commandName = lastCommand.split(' ')[0];
      capturedActions[commandName] = action;
      return mockCommand;
    });

    await import('../../src/index.js');

    const testFile = 'test-post.md';
    const testOptions = { syncUrl: 'wss://test.com' };
    await capturedActions['upload'](testFile, testOptions);

    expect(uploadCommand).toHaveBeenCalledWith(testFile, testOptions);
  });
});
