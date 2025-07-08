import chalk from 'chalk';
import { getConfigManager } from '../lib/config.js';
import { CliConfig } from '../types/config.js';

export async function configListCommand(): Promise<void> {
  try {
    const configManager = getConfigManager();
    const config = await configManager.loadConfig();
    console.log(chalk.bold('Current configuration:'));
    console.log(JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Failed to list configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function configGetCommand(key: string): Promise<void> {
  try {
    const configManager = getConfigManager();
    const value = await configManager.getConfigValue(key);
    if (value === undefined) {
      console.log(chalk.yellow(`Configuration key '${key}' not found`));
    } else {
      console.log(JSON.stringify(value, null, 2));
    }
  } catch (error) {
    throw new Error(`Failed to get configuration value: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function configSetCommand(key: string, value: string): Promise<void> {
  try {
    const configManager = getConfigManager();
    
    // Try to parse the value as JSON first, fallback to string
    let parsedValue: any;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }

    // Validate the key exists in the config structure
    const validKeys = [
      'network.syncUrl',
      'network.timeout',
      'storage.dataPath',
      'storage.indexIdFile',
      'sync.defaultSource'
    ];

    if (!validKeys.includes(key)) {
      throw new Error(`Invalid configuration key: ${key}. Valid keys are: ${validKeys.join(', ')}`);
    }

    // Additional validation for specific keys
    if (key === 'sync.defaultSource') {
      if (parsedValue !== 'local' && parsedValue !== 'remote' && parsedValue !== 'all') {
        throw new Error('sync.defaultSource must be "local", "remote", or "all"');
      }
    }

    if (key === 'network.timeout' && typeof parsedValue !== 'number') {
      throw new Error('network.timeout must be a number');
    }

    await configManager.setConfigValue(key, parsedValue);
    console.log(chalk.green(`Configuration updated: ${key} = ${JSON.stringify(parsedValue)}`));
  } catch (error) {
    throw new Error(`Failed to set configuration value: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function configResetCommand(key?: string): Promise<void> {
  try {
    const configManager = getConfigManager();
    
    if (key) {
      // Reset specific key to default
      const defaultConfig = await configManager.loadConfig();
      await configManager.resetConfig();
      const newConfig = await configManager.loadConfig();
      await configManager.setConfigValue(key, getDefaultValue(key, newConfig));
      console.log(chalk.green(`Configuration key '${key}' reset to default`));
    } else {
      // Reset entire config
      await configManager.resetConfig();
      console.log(chalk.green('Configuration reset to defaults'));
    }
  } catch (error) {
    throw new Error(`Failed to reset configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function configPathCommand(): Promise<void> {
  try {
    const configManager = getConfigManager();
    const configPath = configManager.getConfigPath();
    const dataPath = configManager.getDataPath();
    
    console.log(chalk.bold('Configuration paths:'));
    console.log(`Config file: ${configPath}`);
    console.log(`Data directory: ${dataPath}`);
  } catch (error) {
    throw new Error(`Failed to get configuration paths: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getDefaultValue(key: string, config: CliConfig): any {
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