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
  .option('--source [source]', 'Sync source: local, remote, or all', 'all')
  .action(async (file: string, options) => {
    try {
      const source = options.source as SyncSource;
      if (source !== 'local' && source !== 'remote' && source !== 'all') {
        throw new Error('Source must be "local", "remote", or "all"');
      }
      await uploadCommand(file, source);
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
  .option('--source [source]', 'Sync source: local, remote, or all', 'all')
  .action(async (options) => {
    try {
      const source = options.source as SyncSource;
      if (source !== 'local' && source !== 'remote' && source !== 'all') {
        throw new Error('Source must be "local", "remote", or "all"');
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
  .option('--source [source]', 'Sync source: local, remote, or all', 'all')
  .action(async (slug: string, options) => {
    try {
      const source = options.source as SyncSource;
      if (source !== 'local' && source !== 'remote' && source !== 'all') {
        throw new Error('Source must be "local", "remote", or "all"');
      }
      await deleteCommand(slug, source);
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
