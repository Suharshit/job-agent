// src/bot/start.ts

import dotenv from 'dotenv';
dotenv.config();

import { startBot } from './telegram';
import { startMonitor, stopMonitor } from '../utils/monitor';
import { sendAlert } from '../utils/mailer';
import { log, logError, sleep } from '../utils/helpers';

async function shutdown(signal: string): Promise<void> {
  log('startup', `Received ${signal} — shutting down`);
  stopMonitor();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', async (error) => {
  logError('startup', 'Uncaught exception', error);
  await sendAlert('Uncaught Exception', String(error), 'error');
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  logError('startup', 'Unhandled rejection', reason);
  await sendAlert('Unhandled Rejection', String(reason), 'error');
  process.exit(1);
});

async function main() {
  log('startup', 'Job Agent Bot starting...');

  // Wait 10 seconds on startup to let any previous instance fully shut down
  // This prevents 409 conflicts when Railway restarts the container
  log('startup', 'Waiting 10s for previous instance to shut down...');
  await sleep(10000);

  startMonitor();

  try {
    await startBot();
  } catch (error: any) {
    const is409 = String(error).includes('409');

    if (is409) {
      logError('startup', 'Another instance is running (409) — waiting 30s before exit');
      await sleep(30000);
      process.exit(1); // Railway will restart after delay
    } else {
      logError('startup', 'Failed to start bot', error);
      await sendAlert('Bot failed to start', String(error), 'error');
      process.exit(1);
    }
  }
}

main();