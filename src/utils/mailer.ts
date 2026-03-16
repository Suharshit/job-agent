// src/utils/mailer.ts

import { google } from 'googleapis';
import { config } from './config';
import { log, logError } from './helpers';

export type AlertType = 'error' | 'warning' | 'info';

// Create OAuth2 client using service account won't work for Gmail
// Instead we use a simple fetch to Gmail API with an access token
// The simplest free alternative: use Telegram itself as the alert channel

export async function sendAlert(
  subject: string,
  body: string,
  type: AlertType = 'error'
): Promise<void> {
  const emoji = type === 'error' ? '🔴' : type === 'warning' ? '🟡' : '🟢';

  // Primary: Send via Telegram (always works, no SMTP needed)
  await sendTelegramAlert(`${emoji} *${subject}*\n\n${body}`);
}

export async function sendErrorAlert(module: string, error: unknown): Promise<void> {
  const errorMessage = error instanceof Error
    ? error.message
    : String(error);

  await sendAlert(
    `Error in ${module}`,
    `Module: ${module}\n\nError: ${errorMessage}`,
    'error'
  );
}

export async function sendQuotaAlert(): Promise<void> {
  await sendAlert(
    'Gemini API quota exhausted',
    'Your daily Gemini quota (20 requests) has been used up.\n\nBot resumes tomorrow when quota resets.',
    'warning'
  );
}

async function sendTelegramAlert(message: string): Promise<void> {
  if (!config.telegramToken || !config.chatId) return;

  try {
    const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
      }),
    });

    if (response.ok) {
      log('mailer', 'Alert sent via Telegram');
    } else {
      logError('mailer', 'Telegram alert failed', await response.text());
    }
  } catch (error) {
    logError('mailer', 'Failed to send Telegram alert', error);
  }
}