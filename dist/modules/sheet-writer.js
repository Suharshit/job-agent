"use strict";
// src/modules/sheet-writer.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSheet = initSheet;
exports.writeJobToSheet = writeJobToSheet;
const googleapis_1 = require("googleapis");
const config_1 = require("../utils/config");
const helpers_1 = require("../utils/helpers");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
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
        const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8');
        credentials = JSON.parse(decoded);
    }
    else {
        // Local: read from file
        const credPath = path.resolve(process.cwd(), config_1.config.credentialsPath);
        credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    }
    const auth = new googleapis_1.google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });
    const authClient = await auth.getClient();
    return googleapis_1.google.sheets({ version: 'v4', auth: authClient });
}
async function initSheet() {
    (0, helpers_1.log)('sheets', 'Initializing sheet headers...');
    try {
        const sheets = await getSheets();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: config_1.config.sheetId,
            range: 'Sheet1!A1:Z1',
        });
        if (res.data.values && res.data.values.length > 0) {
            (0, helpers_1.log)('sheets', 'Headers already exist — skipping init');
            return;
        }
        await sheets.spreadsheets.values.update({
            spreadsheetId: config_1.config.sheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'RAW',
            requestBody: { values: [HEADERS] },
        });
        (0, helpers_1.log)('sheets', '✅ Headers written successfully');
    }
    catch (error) {
        (0, helpers_1.logError)('sheets', 'Failed to init sheet', error);
        throw error;
    }
}
async function writeJobToSheet(job) {
    (0, helpers_1.log)('sheets', `Writing row for: ${job.company} — ${job.role}`);
    try {
        const sheets = await getSheets();
        // 5 tailored resume bullets
        const bullets = [0, 1, 2, 3, 4].map(i => job.tailored_bullets[i] ?? '');
        // 5 AI-suggested contacts — only search title + cold message
        // You manually search the title on LinkedIn and paste the person's name
        const contacts = [0, 1, 2, 3, 4].map(i => [
            job.contacts[i]?.title ?? '', // Title to search on LinkedIn
            job.contacts[i]?.email ?? '', // Cold message for this person type
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
            spreadsheetId: config_1.config.sheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [row] },
        });
        (0, helpers_1.log)('sheets', `✅ Row written for ${job.company}`);
    }
    catch (error) {
        (0, helpers_1.logError)('sheets', `Failed to write row for ${job.company}`, error);
        throw error;
    }
}
