"use strict";
// src/bot/start.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const telegram_1 = require("./telegram");
const monitor_1 = require("../utils/monitor");
const mailer_1 = require("../utils/mailer");
const helpers_1 = require("../utils/helpers");
async function shutdown(signal) {
    (0, helpers_1.log)('startup', `Received ${signal} — shutting down`);
    (0, monitor_1.stopMonitor)();
    process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', async (error) => {
    (0, helpers_1.logError)('startup', 'Uncaught exception', error);
    await (0, mailer_1.sendAlert)('Uncaught Exception', String(error), 'error');
    process.exit(1);
});
process.on('unhandledRejection', async (reason) => {
    (0, helpers_1.logError)('startup', 'Unhandled rejection', reason);
    await (0, mailer_1.sendAlert)('Unhandled Rejection', String(reason), 'error');
    process.exit(1);
});
(0, helpers_1.log)('startup', 'Job Agent Bot starting...');
(0, monitor_1.startMonitor)();
(0, telegram_1.startBot)().catch(async (error) => {
    (0, helpers_1.logError)('startup', 'Failed to start bot', error);
    await (0, mailer_1.sendAlert)('Bot failed to start', String(error), 'error');
    process.exit(1);
});
