export interface NetworkConfig {
  syncUrl: string;
  timeout: number;
}

export interface StorageConfig {
  dataPath: string;
  indexIdFile: string;
}

export interface SyncConfig {
  defaultSource: 'local' | 'remote' | 'all';
}

export interface CliConfig {
  network: NetworkConfig;
  storage: StorageConfig;
  sync: SyncConfig;
}

export interface ConfigLoader {
  loadConfig(): Promise<CliConfig>;
  getConfigPath(): string;
  getDataPath(): string;
  saveConfig(config: Partial<CliConfig>): Promise<void>;
  resetConfig(): Promise<void>;
  setConfigValue(key: string, value: any): Promise<void>;
  getConfigValue(key: string): Promise<any>;
}

export const DEFAULT_CONFIG: CliConfig = {
  network: {
    syncUrl: 'wss://sync.automerge.org',
    timeout: 30000
  },
  storage: {
    dataPath: '', // Will be set to OS-appropriate path
    indexIdFile: 'index-id.txt'
  },
  sync: {
    defaultSource: 'all'
  }
};