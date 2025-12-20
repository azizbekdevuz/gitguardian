#!/usr/bin/env node
import { program } from 'commander';
import { snapshotCommand } from './commands/snapshot.js';

program
  .name('gitguard')
  .description('GitGuard Agent - Safe git recovery helper')
  .version('1.0.0');

program
  .command('snapshot')
  .description('Generate a read-only snapshot of the current git repository state')
  .option('-o, --output <file>', 'Write snapshot to file instead of stdout')
  .option('--pretty', 'Pretty-print JSON output')
  .action(snapshotCommand);

program.parse();
