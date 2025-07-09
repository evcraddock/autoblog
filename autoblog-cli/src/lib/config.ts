import fs from 'fs/promises';
import * as path from 'path';
import os from 'os';
import { CliConfig, DEFAULT_CONFIG, ConfigLoader } from '../types/config.js';

export class ConfigManager implements ConfigLoader {
  private config: CliConfig | null = null;

  constructor() {
    // Configuration paths are determined dynamically based on current working directory
  }

  private getConfigFilePath(): string {
    const platform = os.platform();
    const homeDir = os.homedir();
    const cwd = process.cwd();

    // Check for project-specific config first
    const projectConfig = path.join(cwd, '.autoblog', 'config.json');
    try {
      const fs = require('fs');
      fs.accessSync(projectConfig, fs.constants.F_OK);
      return projectConfig;
    } catch {
      // Project config doesn't exist, fall back to global config
    }

    // Return OS-appropriate global config path
    switch (platform) {
      case 'win32':
        return path.join(
          process.env.APPDATA || homeDir,
          'autoblog',
          'config.json'
        );
      case 'darwin':
      case 'linux':
      default:
        const configHome =
          process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config');
        return path.join(configHome, 'autoblog', 'config.json');
    }
  }

  private getDataDirectoryPath(): string {
    const platform = os.platform();
    const homeDir = os.homedir();
    const cwd = process.cwd();

    // Check if we're using project-specific config
    const projectConfigExists = this.fileExistsSync(
      path.join(cwd, '.autoblog', 'config.json')
    );
    if (projectConfigExists) {
      return path.join(cwd, '.autoblog', 'data');
    }

    // Return OS-appropriate data directory
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

  private fileExistsSync(filePath: string): boolean {
    try {
      require('fs').accessSync(filePath, require('fs').constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private isProjectConfig(configPath: string): boolean {
    const cwd = process.cwd();
    const projectConfigPath = path.join(cwd, '.autoblog', 'config.json');
    return configPath === projectConfigPath;
  }

  private async createDefaultConfigFile(
    config: CliConfig,
    configPath: string
  ): Promise<void> {
    try {
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      // Silently fail if we can't create the config file
      // This might happen due to permissions or other issues
    }
  }

  private async createDataDirectory(dataPath: string): Promise<void> {
    try {
      await fs.mkdir(dataPath, { recursive: true });
    } catch (error) {
      // Silently fail if we can't create the data directory
      // This might happen due to permissions or other issues
    }
  }

  getConfigPath(): string {
    return this.getConfigFilePath();
  }

  getDataPath(): string {
    return this.getDataDirectoryPath();
  }

  async loadConfig(): Promise<CliConfig> {
    // Don't use cache to ensure fresh configuration for each call

    const configPath = this.getConfigFilePath();
    const dataPath = this.getDataDirectoryPath();

    // Start with default config
    let config: CliConfig = {
      ...DEFAULT_CONFIG,
      storage: {
        ...DEFAULT_CONFIG.storage,
        dataPath: dataPath,
      },
    };

    // Load from config file
    let configFileExists = false;
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const fileConfig = JSON.parse(configContent);
      config = this.mergeConfigs(config, fileConfig);
      configFileExists = true;
    } catch (error) {
      // Config file doesn't exist or is invalid, will create default
    }

    // If no config file exists and we're using the global config path, create default config
    if (!configFileExists && !this.isProjectConfig(configPath)) {
      await this.createDefaultConfigFile(config, configPath);
    }

    // Always ensure data directory exists on first run
    await this.createDataDirectory(dataPath);

    // Override with environment variables
    config = this.applyEnvironmentVariables(config);

    return config;
  }

  private mergeConfigs(
    base: CliConfig,
    override: Partial<CliConfig>
  ): CliConfig {
    return {
      network: {
        ...base.network,
        ...override.network,
      },
      storage: {
        ...base.storage,
        ...override.storage,
      },
    };
  }

  private applyEnvironmentVariables(config: CliConfig): CliConfig {
    const result = { ...config };

    if (process.env.AUTOBLOG_SYNC_URL) {
      result.network.syncUrl = process.env.AUTOBLOG_SYNC_URL;
    }

    if (process.env.AUTOBLOG_TIMEOUT) {
      const timeout = parseInt(process.env.AUTOBLOG_TIMEOUT, 10);
      if (!isNaN(timeout)) {
        result.network.timeout = timeout;
      }
    }

    if (process.env.AUTOBLOG_DATA_PATH) {
      result.storage.dataPath = process.env.AUTOBLOG_DATA_PATH;
    }

    return result;
  }

  async saveConfig(partialConfig: Partial<CliConfig>): Promise<void> {
    const currentConfig = await this.loadConfig();
    const newConfig = this.mergeConfigs(currentConfig, partialConfig);
    const configPath = this.getConfigFilePath();

    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));

    // Don't cache to ensure fresh configuration for each call
    // this.config = newConfig;
  }

  async resetConfig(): Promise<void> {
    const configPath = this.getConfigFilePath();
    try {
      await fs.unlink(configPath);
    } catch (error) {
      // File doesn't exist, that's fine
    }

    // Don't cache to ensure fresh configuration for each call
    // this.config = null;
  }

  async setConfigValue(key: string, value: any): Promise<void> {
    const config = await this.loadConfig();
    const keys = key.split('.');

    let current: any = config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    await this.saveConfig(config);
  }

  async getConfigValue(key: string): Promise<any> {
    const config = await this.loadConfig();
    const keys = key.split('.');

    let current: any = config;
    for (const k of keys) {
      if (!(k in current)) {
        return undefined;
      }
      current = current[k];
    }

    return current;
  }
}

// Create a new instance each time to properly detect working directory changes
export function getConfigManager(): ConfigManager {
  return new ConfigManager();
}
