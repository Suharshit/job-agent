"use strict";
// src/utils/monitor.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordHeartbeat = recordHeartbeat;
exports.resetQuotaAlert = resetQuotaAlert;
exports.handleQuotaExhausted = handleQuotaExhausted;
exports.startMonitor = startMonitor;
exports.stopMonitor = stopMonitor;
const helpers_1 = require("./helpers");
const mailer_1 = require("./mailer");
const config_1 = require("./config");
let lastHeartbeat = Date.now();
let monitorInterval = null;
let quotaAlertSent = false;
function recordHeartbeat() {
    lastHeartbeat = Date.now();
}
function resetQuotaAlert() {
    quotaAlertSent = false;
}
async function handleQuotaExhausted() {
    if (quotaAlertSent)
        return; // Only send once per day
    quotaAlertSent = true;
    (0, helpers_1.log)('monitor', '⚠️ Gemini quota exhausted — sending alert');
    await (0, mailer_1.sendAlert)('Gemini API quota exhausted for today', `Your daily Gemini quota has been used up.\n\nThe bot is still running but AI processing will fail until quota resets.\n\nQuota resets at midnight Pacific Time.\n\nCheck usage: https://aistudio.google.com`, 'warning');
}
function startMonitor() {
    (0, helpers_1.log)('monitor', 'Starting health monitor (checks every 30 minutes)');
    // Reset quota alert at midnight
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    setTimeout(() => {
        resetQuotaAlert();
        (0, helpers_1.log)('monitor', 'Quota alert reset for new day');
        // Then reset every 24 hours
        setInterval(resetQuotaAlert, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    // Health check every 30 minutes
    monitorInterval = setInterval(async () => {
        const minutesSinceHeartbeat = (Date.now() - lastHeartbeat) / 1000 / 60;
        (0, helpers_1.log)('monitor', `Health check — last heartbeat: ${minutesSinceHeartbeat.toFixed(1)} minutes ago`);
        // If no heartbeat for over 35 minutes something is wrong
        if (minutesSinceHeartbeat > 35) {
            (0, helpers_1.logError)('monitor', `No heartbeat for ${minutesSinceHeartbeat.toFixed(0)} minutes`);
            await (0, mailer_1.sendAlert)('Bot may be unresponsive', `No internal heartbeat recorded for ${minutesSinceHeartbeat.toFixed(0)} minutes.\n\nThe bot process is running but may be stuck.\n\nCheck Railway logs: https://railway.app`, 'error');
        }
    }, 30 * 60 * 1000); // every 30 minutes
    // Send startup confirmation email
    (0, mailer_1.sendAlert)('Bot started successfully', `Job Agent bot has started.\n\nEnvironment: ${config_1.config.isDev ? 'Development' : 'Production'}\nTime: ${new Date().toISOString()}\nSheet: ${config_1.config.sheetUrl}`, 'info').catch(() => { });
}
function stopMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
        (0, helpers_1.log)('monitor', 'Health monitor stopped');
    }
}
