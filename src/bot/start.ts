// src/bot/start.ts

import dotenv from 'dotenv';
dotenv.config();

import { startBot } from './telegram';
import { startMonitor, stopMonitor } from '../utils/monitor';
import { sendAlert } from '../utils/mailer';
import { log, logError } from '../utils/helpers';

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

log('startup', 'Job Agent Bot starting...');
startMonitor();

startBot().catch(async (error) => {
  logError('startup', 'Failed to start bot', error);
  await sendAlert('Bot failed to start', String(error), 'error');
  process.exit(1);
});