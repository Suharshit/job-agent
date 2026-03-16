// src/bot/start.ts

import dotenv from 'dotenv';
dotenv.config();

import { startBot } from './telegram';
import { log } from '../utils/helpers';

log('startup', '🤖 Job Agent Bot starting...');
log('startup', 'Keep this terminal open — bot runs as long as this is running');
log('startup', 'Press Ctrl+C to stop');

startBot().catch((err) => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});