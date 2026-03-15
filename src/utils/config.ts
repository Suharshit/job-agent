// src/utils/config.ts

import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  geminiKey:       requireEnv('GEMINI_API_KEY'),
  telegramToken:   requireEnv('TELEGRAM_BOT_TOKEN'),
  sheetId:         requireEnv('GOOGLE_SHEET_ID'),
  credentialsPath: requireEnv('GOOGLE_CREDENTIALS_PATH'),
  chatId:          requireEnv('YOUR_TELEGRAM_CHAT_ID'),
  sheetUrl:        process.env.GOOGLE_SHEET_URL ?? '',
  isDev:           process.env.NODE_ENV !== 'production',
};