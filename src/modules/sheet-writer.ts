// src/modules/sheet-writer.ts

import { google } from 'googleapis';
import { config } from '../utils/config';
import { log, logError } from '../utils/helpers';
import { JobEntry } from '../types';
import * as path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const HEADERS = [
  'Job ID', 'Scraped At', 'Company', 'Role', 'Location', 'JD URL',
  'Match Score', 'Bullet 1', 'Bullet 2', 'Bullet 3', 'Bullet 4', 'Bullet 5',
  'Contact 1 Name', 'Contact 1 Title', 'Contact 1 LinkedIn', 'Contact 1 Email',
  'Contact 2 Name', 'Contact 2 Title', 'Contact 2 LinkedIn', 'Contact 2 Email',
  'Contact 3 Name', 'Contact 3 Title', 'Contact 3 LinkedIn', 'Contact 3 Email',
  'Cold Message', 'Status',
];

async function getSheets() {
  const credPath = path.resolve(process.cwd(), config.credentialsPath);
  const auth = new google.auth.GoogleAuth({
    keyFile: credPath,
    scopes: SCOPES,
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient as any });
}

export async function initSheet(): Promise<void> {
  log('sheets', 'Initializing sheet headers...');
  try {
    const sheets = await getSheets();

    // Check if headers already exist
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.sheetId,
      range: 'Sheet1!A1:Z1',
    });

    if (res.data.values && res.data.values.length > 0) {
      log('sheets', 'Headers already exist — skipping init');
      return;
    }

    // Write headers
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

    const bullets = [
      job.tailored_bullets[0] ?? '',
      job.tailored_bullets[1] ?? '',
      job.tailored_bullets[2] ?? '',
      job.tailored_bullets[3] ?? '',
      job.tailored_bullets[4] ?? '',
    ];

    const contacts = [0, 1, 2].map(i => [
      job.contacts[i]?.name ?? '',
      job.contacts[i]?.title ?? '',
      job.contacts[i]?.linkedin_url ?? '',
      job.contacts[i]?.email ?? '',
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