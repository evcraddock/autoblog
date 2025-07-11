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

export async function configSetCommand(
  key: string,
  value: string
): Promise<void> {
  console.log(
    chalk.yellow('Configuration is now read-only from environment variables.')
  );
  console.log(chalk.blue('Set the following environment variables:'));
  console.log(chalk.blue('  AUTOBLOG_SYNC_URL - WebSocket sync server URL'));
  console.log(chalk.blue('  AUTOBLOG_DATA_PATH - Local data storage path'));
}

export async function configResetCommand(key?: string): Promise<void> {
  console.log(
    chalk.yellow('Configuration is now read-only from environment variables.')
  );
  console.log(
    chalk.blue(
      'Configuration cannot be reset - remove environment variables to use defaults.'
    )
  );
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
