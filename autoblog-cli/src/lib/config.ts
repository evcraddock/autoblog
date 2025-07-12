import * as path from 'path';
import * as os from 'os';

export interface SimpleConfig {
  syncUrl: string;
  dataPath: string;
}

function getDefaultDataPath(): string {
  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case 'win32':
      return path.join(process.env.APPDATA || homeDir, 'autoblog', 'data');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'autoblog');
    case 'linux':
    default:
      const dataHome =
        process.env.XDG_DATA_HOME || path.join(homeDir, '.local', 'share');
      return path.join(dataHome, 'autoblog');
  }
}

function getDefaultSyncServer(): string {
  // TODO: get from config file
  return 'ws://10.10.1.122:3030';
}

export function getConfig(): SimpleConfig {
  const syncUrl = process.env.AUTOBLOG_SYNC_URL || getDefaultSyncServer();
  const dataPath = process.env.AUTOBLOG_DATA_PATH || getDefaultDataPath();

  return {
    syncUrl,
    dataPath,
  };
}
