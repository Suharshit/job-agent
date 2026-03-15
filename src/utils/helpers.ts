// src/utils/helpers.ts

export function log(module: string, message: string): void {
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${time}] [${module}] ${message}`);
}

export function logError(module: string, message: string, error?: unknown): void {
  const time = new Date().toISOString().split('T')[1].split('.')[0];
  console.error(`[${time}] [${module}] ❌ ${message}`, error ?? '');
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return sleep(ms);
}

export function sanitizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, '\n')
    .trim();
}