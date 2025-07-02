#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('autoblog')
  .description('CLI tool for Automerge-powered blog')
  .version('0.1.0');

program
  .command('upload <file>')
  .description('Upload a markdown file to the blog')
  .action((file: string) => {
    console.log(
      chalk.blue(`Upload functionality coming soon for file: ${file}`)
    );
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
