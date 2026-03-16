"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function requireEnv(key) {
    const value = process.env[key];
    if (!value)
        throw new Error(`Missing required environment variable: ${key}`);
    return value;
}
exports.config = {
    geminiKey: requireEnv('GEMINI_API_KEY'),
    telegramToken: requireEnv('TELEGRAM_BOT_TOKEN'),
    sheetId: requireEnv('GOOGLE_SHEET_ID'),
    credentialsPath: requireEnv('GOOGLE_CREDENTIALS_PATH'),
    chatId: requireEnv('YOUR_TELEGRAM_CHAT_ID'),
    sheetUrl: process.env.GOOGLE_SHEET_URL ?? '',
    isDev: process.env.NODE_ENV !== 'production',
    maxJobs: 6,
    linkedinCookie: process.env.LINKEDIN_COOKIE ?? '',
    alertEmail: process.env.ALERT_EMAIL ?? '',
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? '',
};
