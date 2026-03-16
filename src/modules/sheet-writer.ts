// src/modules/sheet-writer.ts

import { google } from 'googleapis';
import { config } from '../utils/config';
import { log, logError } from '../utils/helpers';
import { JobEntry } from '../types';
import * as path from 'path';
import * as fs from 'fs';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const HEADERS = [
  // Job Info
  'Job ID',
  'Scraped At',
  'Company',
  'Role',
  'Location',
  'JD URL',
  'Match Score',

  // Tailored Resume Bullets
  'Bullet 1',
  'Bullet 2',
  'Bullet 3',
  'Bullet 4',
  'Bullet 5',

  // AI-Suggested People to Contact (search these titles on LinkedIn)
  'Search Title 1', 'Cold Message 1',
  'Search Title 2', 'Cold Message 2',
  'Search Title 3', 'Cold Message 3',
  'Search Title 4', 'Cold Message 4',
  'Search Title 5', 'Cold Message 5',

  // General
  'General Cold Message',
  'Status',
];

async function getSheets() {
  let credentials;

  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    // Production (Railway): decode from env variable
    const decoded = Buffer.from(
      process.env.GOOGLE_CREDENTIALS_BASE64,
      'base64'
    ).toString('utf-8');
    credentials = JSON.parse(decoded);
  } else {
    // Local: read from file
    const credPath = path.resolve(process.cwd(), config.credentialsPath);
    credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient as any });
}

export async function initSheet(): Promise<void> {
  log('sheets', 'Initializing sheet headers...');
  try {
    const sheets = await getSheets();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.sheetId,
      range: 'Sheet1!A1:Z1',
    });

    if (res.data.values && res.data.values.length > 0) {
      log('sheets', 'Headers already exist — skipping init');
      return;
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: config.sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });

    log('sheets', '✅ Headers written successfully');
  } catch (error) {
    logError('sheets', 'Failed to init sheet', error);
    throw error;
  }
}

export async function writeJobToSheet(job: JobEntry): Promise<void> {
  log('sheets', `Writing row for: ${job.company} — ${job.role}`);
  try {
    const sheets = await getSheets();

    // 5 tailored resume bullets
    const bullets = [0, 1, 2, 3, 4].map(i => job.tailored_bullets[i] ?? '');

    // 5 AI-suggested contacts — only search title + cold message
    // You manually search the title on LinkedIn and paste the person's name
    const contacts = [0, 1, 2, 3, 4].map(i => [
      job.contacts[i]?.title ?? '',   // Title to search on LinkedIn
      job.contacts[i]?.email ?? '',   // Cold message for this person type
    ]).flat();

    const row = [
      job.job_id,
      job.scraped_at,
      job.company,
      job.role,
      job.location,
      job.jd_url,
      job.match_score,
      ...bullets,
      ...contacts,
      job.cold_message,
      job.status,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    log('sheets', `✅ Row written for ${job.company}`);
  } catch (error) {
    logError('sheets', `Failed to write row for ${job.company}`, error);
    throw error;
  }
}