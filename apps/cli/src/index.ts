#!/usr/bin/env node
import { program } from 'commander';
import { snapshotCommand } from './commands/snapshot.js';
import { sendCommand } from './commands/send.js';

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

program
  .command('send')
  .description('Capture and send repository state to GitGuard for analysis')
  .option('-u, --api-url <url>', 'GitGuard API URL (default: http://localhost:3000)')
  .option('-o, --open', 'Open the incident room in browser after upload')
  .action(sendCommand);

program.parse();
