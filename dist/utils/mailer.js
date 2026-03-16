"use strict";
// src/utils/mailer.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAlert = sendAlert;
exports.sendErrorAlert = sendErrorAlert;
exports.sendQuotaAlert = sendQuotaAlert;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("./config");
const helpers_1 = require("./helpers");
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: config_1.config.alertEmail,
        pass: config_1.config.gmailAppPassword,
    },
});
async function sendAlert(subject, body, type = 'error') {
    if (!config_1.config.alertEmail || !config_1.config.gmailAppPassword) {
        (0, helpers_1.log)('mailer', 'No email config — skipping alert');
        return;
    }
    const emoji = type === 'error' ? '🔴' : type === 'warning' ? '🟡' : '🟢';
    const timestamp = new Date().toISOString();
    try {
        await transporter.sendMail({
            from: `"Job Agent Monitor" <${config_1.config.alertEmail}>`,
            to: config_1.config.alertEmail,
            subject: `${emoji} Job Agent: ${subject}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: ${type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#16a34a'}">
            ${emoji} ${subject}
          </h2>
          <p><strong>Time:</strong> ${timestamp}</p>
          <p><strong>Environment:</strong> ${config_1.config.isDev ? 'Development' : 'Production'}</p>
          <hr/>
          <pre style="background:#f4f4f4; padding:16px; border-radius:8px; overflow-x:auto;">
${body}
          </pre>
          <hr/>
          <p style="color:#666; font-size:12px;">Job Agent Monitor — automated alert</p>
        </div>
      `,
        });
        (0, helpers_1.log)('mailer', `Alert sent: "${subject}"`);
    }
    catch (error) {
        (0, helpers_1.logError)('mailer', 'Failed to send alert email', error);
    }
}
async function sendErrorAlert(module, error) {
    const errorMessage = error instanceof Error
        ? `${error.message}\n\nStack:\n${error.stack}`
        : String(error);
    await sendAlert(`Error in ${module}`, `Module: ${module}\n\nError:\n${errorMessage}`, 'error');
}
async function sendQuotaAlert() {
    await sendAlert('Gemini API quota exhausted', `Your daily Gemini quota (20 requests) has been exhausted.\n\nThe bot will resume tomorrow when quota resets.\n\nTo check usage: https://aistudio.google.com`, 'warning');
}
