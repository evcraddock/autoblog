import chalk from 'chalk';
import { getConfig } from '../lib/config.js';

export async function configListCommand(): Promise<void> {
  try {
    const config = getConfig();
    console.log(chalk.bold('Current configuration:'));
    console.log(JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(
      `Failed to list configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function configGetCommand(key: string): Promise<void> {
  try {
    const config = getConfig();
    const value = (config as any)[key];
    if (value === undefined) {
      console.log(chalk.yellow(`Configuration key '${key}' not found`));
    } else {
      console.log(JSON.stringify(value, null, 2));
    }
  } catch (error) {
    throw new Error(
      `Failed to get configuration value: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function configPathCommand(): Promise<void> {
  try {
    const config = getConfig();
    console.log(chalk.bold('Configuration paths:'));
    console.log(`Data directory: ${config.dataPath}`);
    console.log(`Sync URL: ${config.syncUrl}`);
  } catch (error) {
    throw new Error(
      `Failed to get configuration paths: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
