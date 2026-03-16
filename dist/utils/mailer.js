"use strict";
// src/utils/mailer.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAlert = sendAlert;
exports.sendErrorAlert = sendErrorAlert;
exports.sendQuotaAlert = sendQuotaAlert;
const config_1 = require("./config");
const helpers_1 = require("./helpers");
// Create OAuth2 client using service account won't work for Gmail
// Instead we use a simple fetch to Gmail API with an access token
// The simplest free alternative: use Telegram itself as the alert channel
async function sendAlert(subject, body, type = 'error') {
    const emoji = type === 'error' ? '🔴' : type === 'warning' ? '🟡' : '🟢';
    // Primary: Send via Telegram (always works, no SMTP needed)
    await sendTelegramAlert(`${emoji} *${subject}*\n\n${body}`);
}
async function sendErrorAlert(module, error) {
    const errorMessage = error instanceof Error
        ? error.message
        : String(error);
    await sendAlert(`Error in ${module}`, `Module: ${module}\n\nError: ${errorMessage}`, 'error');
}
async function sendQuotaAlert() {
    await sendAlert('Gemini API quota exhausted', 'Your daily Gemini quota (20 requests) has been used up.\n\nBot resumes tomorrow when quota resets.', 'warning');
}
async function sendTelegramAlert(message) {
    if (!config_1.config.telegramToken || !config_1.config.chatId)
        return;
    try {
        const url = `https://api.telegram.org/bot${config_1.config.telegramToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config_1.config.chatId,
                text: message,
            }),
        });
        if (response.ok) {
            (0, helpers_1.log)('mailer', 'Alert sent via Telegram');
        }
        else {
            (0, helpers_1.logError)('mailer', 'Telegram alert failed', await response.text());
        }
    }
    catch (error) {
        (0, helpers_1.logError)('mailer', 'Failed to send Telegram alert', error);
    }
}
