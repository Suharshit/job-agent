// src/utils/monitor.ts

import { log, logError } from './helpers';
import { sendAlert, sendErrorAlert } from './mailer';
import { config } from './config';

let lastHeartbeat = Date.now();
let monitorInterval: NodeJS.Timeout | null = null;
let quotaAlertSent = false;

export function recordHeartbeat(): void {
  lastHeartbeat = Date.now();
}

export function resetQuotaAlert(): void {
  quotaAlertSent = false;
}

export async function handleQuotaExhausted(): Promise<void> {
  if (quotaAlertSent) return; // Only send once per day
  quotaAlertSent = true;

  log('monitor', '⚠️ Gemini quota exhausted — sending alert');
  await sendAlert(
    'Gemini API quota exhausted for today',
    `Your daily Gemini quota has been used up.\n\nThe bot is still running but AI processing will fail until quota resets.\n\nQuota resets at midnight Pacific Time.\n\nCheck usage: https://aistudio.google.com`,
    'warning'
  );
}

export function startMonitor(): void {
  log('monitor', 'Starting health monitor (checks every 30 minutes)');

  // Reset quota alert at midnight
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();

  setTimeout(() => {
    resetQuotaAlert();
    log('monitor', 'Quota alert reset for new day');
    // Then reset every 24 hours
    setInterval(resetQuotaAlert, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  // Health check every 30 minutes
  monitorInterval = setInterval(async () => {
    const minutesSinceHeartbeat = (Date.now() - lastHeartbeat) / 1000 / 60;

    log('monitor', `Health check — last heartbeat: ${minutesSinceHeartbeat.toFixed(1)} minutes ago`);

    // If no heartbeat for over 35 minutes something is wrong
    if (minutesSinceHeartbeat > 35) {
      logError('monitor', `No heartbeat for ${minutesSinceHeartbeat.toFixed(0)} minutes`);
      await sendAlert(
        'Bot may be unresponsive',
        `No internal heartbeat recorded for ${minutesSinceHeartbeat.toFixed(0)} minutes.\n\nThe bot process is running but may be stuck.\n\nCheck Railway logs: https://railway.app`,
        'error'
      );
    }
  }, 30 * 60 * 1000); // every 30 minutes

  // Send startup confirmation email
  sendAlert(
    'Bot started successfully',
    `Job Agent bot has started.\n\nEnvironment: ${config.isDev ? 'Development' : 'Production'}\nTime: ${new Date().toISOString()}\nSheet: ${config.sheetUrl}`,
    'info'
  ).catch(() => {});
}

export function stopMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    log('monitor', 'Health monitor stopped');
  }
}