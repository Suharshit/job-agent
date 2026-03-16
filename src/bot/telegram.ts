// src/bot/telegram.ts

import { Bot, Context } from 'grammy';
import { config } from '../utils/config';
import { log, logError } from '../utils/helpers';
import { sendErrorAlert } from '../utils/mailer';
import { recordHeartbeat, handleQuotaExhausted } from '../utils/monitor';
import { runPipeline } from '../index';

const bot = new Bot(config.telegramToken);

function isAuthorized(ctx: Context): boolean {
  return String(ctx.chat?.id) === config.chatId;
}

function unauthorized(ctx: Context): void {
  log('bot', `Unauthorized access from: ${ctx.chat?.id}`);
  ctx.reply('Unauthorized.');
}

bot.command('start', (ctx) => {
  if (!isAuthorized(ctx)) return unauthorized(ctx);
  recordHeartbeat();
  ctx.reply(
    'Hey Suharshit! Your Job Agent is live.\n\n' +
    'Commands:\n' +
    '/find [query] — Hunt for jobs\n' +
    '/status — This week stats\n' +
    '/help — Show commands\n\n' +
    'Example:\n' +
    '/find full stack intern remote India'
  );
});

bot.command('help', (ctx) => {
  if (!isAuthorized(ctx)) return unauthorized(ctx);
  recordHeartbeat();
  ctx.reply(
    'Job Agent Commands:\n\n' +
    '/find [query] — Scrapes jobs, tailors resume, drafts cold messages, writes to sheet\n\n' +
    '/status — Shows jobs found and applied this week\n\n' +
    'Examples:\n' +
    '/find full stack intern India\n' +
    '/find Next.js developer intern remote\n' +
    '/find SDE intern Bangalore\n\n' +
    'Results appear in your sheet within 5-7 minutes.'
  );
});

bot.command('status', async (ctx) => {
  if (!isAuthorized(ctx)) return unauthorized(ctx);
  recordHeartbeat();
  await ctx.reply(
    'Bot status: Online\n' +
    'Sheet: ' + config.sheetUrl + '\n\n' +
    'Open your sheet to see job stats.'
  );
});

bot.command('find', async (ctx) => {
  if (!isAuthorized(ctx)) return unauthorized(ctx);
  recordHeartbeat();

  const query = ctx.match?.trim();
  if (!query) {
    ctx.reply('Please provide a search query.\n\nExample:\n/find full stack intern India');
    return;
  }

  log('bot', `Received /find command: "${query}"`);

  await ctx.reply(
    'Starting job hunt for: "' + query + '"\n\n' +
    'This takes 5-7 minutes.\n' +
    'I will send updates as each step completes.'
  );

  try {
    const startTime = Date.now();

    const result = await runPipeline(query, async (step: string) => {
      recordHeartbeat();
      await ctx.reply(step);
    });

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (result.success) {
      await ctx.reply(
        'Job Hunt Complete!\n\n' +
        'Jobs processed: ' + result.jobs_processed + '\n' +
        'Time taken: ' + duration + 's\n' +
        'Errors: ' + result.errors.length + '\n\n' +
        'Open your sheet:\n' + config.sheetUrl
      );
    } else {
      await ctx.reply(
        'Pipeline failed.\n\n' +
        'Errors:\n' + result.errors.slice(0, 3).join('\n') + '\n\n' +
        'Check Railway logs for details.'
      );
      await sendErrorAlert('pipeline', result.errors.join('\n'));
    }

  } catch (error: unknown) {
    logError('bot', 'Pipeline crashed', error);

    // Check if it's a quota error
    const errorStr = String(error);
    if (errorStr.includes('429') || errorStr.includes('quota')) {
      await handleQuotaExhausted();
      await ctx.reply(
        'Gemini AI quota exhausted for today.\n\n' +
        'The bot will work again tomorrow when quota resets.\n' +
        'You have been sent an email alert.'
      );
    } else {
      await sendErrorAlert('bot', error);
      await ctx.reply(
        'Something crashed. You have been sent an email alert.\n' +
        'Check Railway logs for details.'
      );
    }
  }
});

bot.on('message', (ctx) => {
  if (!isAuthorized(ctx)) return unauthorized(ctx);
  recordHeartbeat();
  ctx.reply('Unknown command. Send /help to see available commands.');
});

export async function startBot(): Promise<void> {
  log('bot', 'Starting Telegram bot...');

  bot.catch(async (err) => {
    logError('bot', 'Bot error', err);
    await sendErrorAlert('bot', err);
  });

  await bot.start({
    onStart: () => log('bot', 'Bot is running!'),
  });
}