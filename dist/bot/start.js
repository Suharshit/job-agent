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
async function main() {
    (0, helpers_1.log)('startup', 'Job Agent Bot starting...');
    // Wait 10 seconds on startup to let any previous instance fully shut down
    // This prevents 409 conflicts when Railway restarts the container
    (0, helpers_1.log)('startup', 'Waiting 10s for previous instance to shut down...');
    await (0, helpers_1.sleep)(10000);
    (0, monitor_1.startMonitor)();
    try {
        await (0, telegram_1.startBot)();
    }
    catch (error) {
        const is409 = String(error).includes('409');
        if (is409) {
            (0, helpers_1.logError)('startup', 'Another instance is running (409) — waiting 30s before exit');
            await (0, helpers_1.sleep)(30000);
            process.exit(1); // Railway will restart after delay
        }
        else {
            (0, helpers_1.logError)('startup', 'Failed to start bot', error);
            await (0, mailer_1.sendAlert)('Bot failed to start', String(error), 'error');
            process.exit(1);
        }
    }
}
main();
