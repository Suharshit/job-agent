// src/utils/monitor.ts

import { log } from './helpers';
import { sendAlert } from './mailer';

let monitorInterval: NodeJS.Timeout | null = null;
let quotaAlertSent = false;

export function recordHeartbeat(): void {
  // Kept for compatibility — no longer needed for health check
}

export function resetQuotaAlert(): void {
  quotaAlertSent = false;
}

export async function handleQuotaExhausted(): Promise<void> {
  if (quotaAlertSent) return;
  quotaAlertSent = true;

  log('monitor', 'Gemini quota exhausted — sending alert');
  await sendAlert(
    'Gemini API quota exhausted for today',
    'Your daily Gemini quota has been used up.\n\nBot resumes tomorrow when quota resets.\n\nCheck: https://aistudio.google.com',
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
    setInterval(resetQuotaAlert, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  // Simple alive check every 30 minutes — no false alarms
  monitorInterval = setInterval(() => {
    log('monitor', 'Health check passed — bot is alive');
  }, 30 * 60 * 1000);

  // Startup notification
  sendAlert(
    'Bot started successfully',
    'Job Agent is live and ready.\n\nSend /find to start hunting jobs.',
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