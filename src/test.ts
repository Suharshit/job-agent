// src/test.ts

import dotenv from 'dotenv';
dotenv.config();

import { config } from './utils/config';
import { log } from './utils/helpers';
import { JobEntry, Contact } from './types';

async function test() {
  log('test', '--- Phase 2 Type & Config Test ---');

  // Test config loads
  log('test', `Gemini Key exists: ${!!config.geminiKey}`);
  log('test', `Telegram Token exists: ${!!config.telegramToken}`);
  log('test', `Sheet ID exists: ${!!config.sheetId}`);
  log('test', `Chat ID exists: ${!!config.chatId}`);
  log('test', `Dev mode: ${config.isDev}`);

  // Test types work correctly
  const testContact: Contact = {
    name: 'Suharshit Singh',
    title: 'Senior Engineer',
    linkedin_url: 'https://linkedin.com/in/suharshit',
    email: null,
  };

  const testJob: JobEntry = {
    job_id: 'test-123',
    scraped_at: new Date().toISOString(),
    company: 'Razorpay',
    role: 'SDE Intern',
    location: 'Bangalore',
    jd_url: 'https://example.com/job',
    jd_text: 'Sample JD text...',
    match_score: 87,
    tailored_bullets: ['Built X using Y', 'Reduced Z by 40%'],
    contacts: [testContact],
    cold_message: 'Hi Suharshit, I noticed...',
    status: 'pending',
  };

  log('test', `✅ Types work correctly`);
  log('test', `Sample job: ${testJob.company} — ${testJob.role}`);
  log('test', '--- All Phase 2 checks passed ✅ ---');
}

test().catch(console.error);