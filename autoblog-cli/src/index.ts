#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { uploadCommand } from './commands/upload.js';
import { listCommand } from './commands/list.js';
import { deleteCommand } from './commands/delete.js';
import { configListCommand } from './commands/config.js';

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
  .action(async () => {
    try {
      await listCommand();
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

// Config command group
const configCmd = program
  .command('config')
  .description('Manage autoblog configuration');

configCmd
  .command('list')
  .description('Show current configuration')
  .action(async () => {
    try {
      await configListCommand();
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

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('invalid command:', reason));
  process.exit(1);
});

program.parse();
