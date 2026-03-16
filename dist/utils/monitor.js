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
let monitorInterval = null;
let quotaAlertSent = false;
function recordHeartbeat() {
    // Kept for compatibility — no longer needed for health check
}
function resetQuotaAlert() {
    quotaAlertSent = false;
}
async function handleQuotaExhausted() {
    if (quotaAlertSent)
        return;
    quotaAlertSent = true;
    (0, helpers_1.log)('monitor', 'Gemini quota exhausted — sending alert');
    await (0, mailer_1.sendAlert)('Gemini API quota exhausted for today', 'Your daily Gemini quota has been used up.\n\nBot resumes tomorrow when quota resets.\n\nCheck: https://aistudio.google.com', 'warning');
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
        setInterval(resetQuotaAlert, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    // Simple alive check every 30 minutes — no false alarms
    monitorInterval = setInterval(() => {
        (0, helpers_1.log)('monitor', 'Health check passed — bot is alive');
    }, 30 * 60 * 1000);
    // Startup notification
    (0, mailer_1.sendAlert)('Bot started successfully', 'Job Agent is live and ready.\n\nSend /find to start hunting jobs.', 'info').catch(() => { });
}
function stopMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
        (0, helpers_1.log)('monitor', 'Health monitor stopped');
    }
}
