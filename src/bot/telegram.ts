// src/bot/telegram.ts

import { Bot, Context } from 'grammy';
import { config } from '../utils/config';
import { log, logError } from '../utils/helpers';
import { runPipeline } from '../index';

const bot = new Bot(config.telegramToken);

// Security — only respond to YOUR chat ID
function isAuthorized(ctx: Context): boolean {
  return String(ctx.chat?.id) === config.chatId;
}

function unauthorized(ctx: Context): void {
  log('bot', `Unauthorized access attempt from chat ID: ${ctx.chat?.id}`);
  ctx.reply('⛔ Unauthorized.');
}

// /start command
bot.command('start', (ctx) => {
  if (!isAuthorized(ctx)) return unauthorized(ctx);
  ctx.reply(
    `👋 Hey Suharshit! Your Job Agent is ready.\n\n` +
    `Commands:\n` +
    `/find <query> — Search and process jobs\n` +
    `/help — Show this message\n\n` +
    `Example:\n` +
    `/find full stack intern remote India`
  );
});

// /help command
bot.command('help', (ctx) => {
  if (!isAuthorized(ctx)) return unauthorized(ctx);
  ctx.reply(
    `📖 *Job Agent Help*\n\n` +
    `*/find <query>* — Scrapes jobs, tailors your resume, finds contacts, writes everything to your sheet\n\n` +
    `*Examples:*\n` +
    `/find full stack intern India\n` +
    `/find Next.js developer intern remote\n` +
    `/find SDE intern Bangalore\n\n` +
    `Results appear in your Google Sheet within 5-7 minutes.`,
    { parse_mode: 'Markdown' }
  );
});

// /find command — main trigger
bot.command('find', async (ctx) => {
  if (!isAuthorized(ctx)) return unauthorized(ctx);

  const query = ctx.match?.trim();

  if (!query) {
    ctx.reply(
      `⚠️ Please provide a search query.\n\nExample:\n/find full stack intern India`
    );
    return;
  }

  log('bot', `Received /find command: "${query}"`);

  // Acknowledge immediately
  await ctx.reply(
    `🔍 Starting job hunt for:\n*"${query}"*\n\n` +
    `Steps:\n` +
    `⏳ Scraping LinkedIn...\n` +
    `⏳ Fetching job descriptions...\n` +
    `⏳ Running AI processing...\n` +
    `⏳ Writing to Google Sheet...\n\n` +
    `This takes ~5-7 minutes. I'll notify you when done.`,
    { parse_mode: 'Markdown' }
  );

  try {
    // Step updates during pipeline
    const startTime = Date.now();

    const result = await runPipeline(query, async (step: string) => {
      await ctx.reply(`⚙️ ${step}`);
    });

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (result.success) {
      await ctx.reply(
        `✅ Job Hunt Complete!\n\n` +
        `📊 Jobs processed: ${result.jobs_processed}\n` +
        `⏱️ Time taken: ${duration}s\n` +
        `❌ Errors: ${result.errors.length}\n\n` +
        `📋 Open your sheet:\n${config.sheetUrl}`
        // No parse_mode — plain text avoids all markdown issues
        );
    } else {
      await ctx.reply(
        `❌ *Pipeline failed*\n\n` +
        `Errors:\n${result.errors.slice(0, 3).join('\n')}\n\n` +
        `Check your laptop logs for details.`,
        { parse_mode: 'Markdown' }
      );
    }

  } catch (error) {
    logError('bot', 'Pipeline crashed', error);
    await ctx.reply(
      `💥 Something crashed. Check your laptop terminal for the error.`
    );
  }
});

// Handle unknown commands
bot.on('message', (ctx) => {
  if (!isAuthorized(ctx)) return unauthorized(ctx);
  ctx.reply(
    `❓ Unknown command. Send /help to see available commands.`
  );
});

// Start the bot
export async function startBot(): Promise<void> {
  log('bot', 'Starting Telegram bot...');

  bot.catch((err) => {
    logError('bot', 'Bot error', err);
  });

  await bot.start({
    onStart: () => log('bot', '✅ Bot is running! Send /start on Telegram.'),
  });
}