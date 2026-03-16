// src/utils/mailer.ts

import nodemailer from 'nodemailer';
import { config } from './config';
import { log, logError } from './helpers';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.alertEmail,
    pass: config.gmailAppPassword,
  },
});

export type AlertType = 'error' | 'warning' | 'info';

export async function sendAlert(
  subject: string,
  body: string,
  type: AlertType = 'error'
): Promise<void> {
  if (!config.alertEmail || !config.gmailAppPassword) {
    log('mailer', 'No email config — skipping alert');
    return;
  }

  const emoji = type === 'error' ? '🔴' : type === 'warning' ? '🟡' : '🟢';
  const timestamp = new Date().toISOString();

  try {
    await transporter.sendMail({
      from: `"Job Agent Monitor" <${config.alertEmail}>`,
      to: config.alertEmail,
      subject: `${emoji} Job Agent: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: ${type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#16a34a'}">
            ${emoji} ${subject}
          </h2>
          <p><strong>Time:</strong> ${timestamp}</p>
          <p><strong>Environment:</strong> ${config.isDev ? 'Development' : 'Production'}</p>
          <hr/>
          <pre style="background:#f4f4f4; padding:16px; border-radius:8px; overflow-x:auto;">
${body}
          </pre>
          <hr/>
          <p style="color:#666; font-size:12px;">Job Agent Monitor — automated alert</p>
        </div>
      `,
    });
    log('mailer', `Alert sent: "${subject}"`);
  } catch (error) {
    logError('mailer', 'Failed to send alert email', error);
  }
}

export async function sendErrorAlert(module: string, error: unknown): Promise<void> {
  const errorMessage = error instanceof Error
    ? `${error.message}\n\nStack:\n${error.stack}`
    : String(error);

  await sendAlert(
    `Error in ${module}`,
    `Module: ${module}\n\nError:\n${errorMessage}`,
    'error'
  );
}

export async function sendQuotaAlert(): Promise<void> {
  await sendAlert(
    'Gemini API quota exhausted',
    `Your daily Gemini quota (20 requests) has been exhausted.\n\nThe bot will resume tomorrow when quota resets.\n\nTo check usage: https://aistudio.google.com`,
    'warning'
  );
}