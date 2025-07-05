#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { uploadCommand } from './commands/upload.js';
import { listCommand } from './commands/list.js';
import { deleteCommand } from './commands/delete.js';
import { SyncSource } from './lib/automerge.js';

const program = new Command();

program
  .name('autoblog')
  .description('CLI tool for Automerge-powered blog')
  .version('0.1.0');

program
  .command('upload <file>')
  .description('Upload a markdown file to the blog')
  .action(async (file: string) => {
    try {
      await uploadCommand(file);
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all blog posts')
  .option('--source <source>', 'Sync source: local or remote', 'remote')
  .action(async (options) => {
    try {
      const source = options.source as SyncSource;
      if (source !== 'local' && source !== 'remote') {
        throw new Error('Source must be either "local" or "remote"');
      }
      await listCommand(source);
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
  });

program
  .command('delete <slug>')
  .description('Delete a blog post by its slug')
  .action(async (slug: string) => {
    try {
      await deleteCommand(slug);
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
  });

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:', error.message));
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Rejection:', reason));
  process.exit(1);
});

program.parse();
