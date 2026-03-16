// src/bot/start.ts

import dotenv from 'dotenv';
dotenv.config();

import { startBot } from './telegram';
import { startMonitor, stopMonitor } from '../utils/monitor';
import { sendAlert } from '../utils/mailer';
import { log, logError } from '../utils/helpers';

// Graceful shutdown handler
async function shutdown(signal: string): Promise<void> {
  log('startup', `Received ${signal} — shutting down gracefully`);
  stopMonitor();
  await sendAlert(
    'Bot shutting down',
    `Job Agent received ${signal} and is shutting down.\n\nIf this was unexpected, check Railway logs.`,
    'warning'
  );
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', async (error) => {
  logError('startup', 'Uncaught exception', error);
  await sendAlert('Uncaught Exception — Bot may have crashed', String(error), 'error');
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  logError('startup', 'Unhandled rejection', reason);
  await sendAlert('Unhandled Promise Rejection', String(reason), 'error');
});

log('startup', 'Job Agent Bot starting...');
startMonitor();
startBot().catch(async (err) => {
  logError('startup', 'Failed to start bot', err);
  await sendAlert('Bot failed to start', String(err), 'error');
  process.exit(1);
});