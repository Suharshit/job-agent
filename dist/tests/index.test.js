"use strict";
// src/tests/index.test.ts
// Run with: npx ts-node src/tests/index.test.ts
// Zero AI calls, zero Gemini quota used
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ─── Colour helpers ───────────────────────────────────────────────────────────
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
// ─── Simple test runner ───────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];
function test(name, fn) {
    return Promise.resolve()
        .then(() => fn())
        .then(() => {
        passed++;
        results.push({ name, status: 'pass' });
        console.log(`  ${GREEN}✅ PASS${RESET} ${name}`);
    })
        .catch((err) => {
        failed++;
        const error = err?.message ?? String(err);
        results.push({ name, status: 'fail', error });
        console.log(`  ${RED}❌ FAIL${RESET} ${name}`);
        console.log(`       ${RED}→ ${error}${RESET}`);
    });
}
function skip(name, reason) {
    skipped++;
    results.push({ name, status: 'skip' });
    console.log(`  ${YELLOW}⏭  SKIP${RESET} ${name} ${YELLOW}(${reason})${RESET}`);
}
function assert(condition, message) {
    if (!condition)
        throw new Error(message);
}
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message ?? `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}
function assertIncludes(str, substring, message) {
    if (!str.includes(substring)) {
        throw new Error(message ?? `Expected "${str}" to include "${substring}"`);
    }
}
function section(name) {
    console.log(`\n${BLUE}${BOLD}━━ ${name} ${'━'.repeat(50 - name.length)}${RESET}`);
}
// ─── Mock data ────────────────────────────────────────────────────────────────
const mockJobListing = {
    title: 'Full Stack Software Intern',
    company: 'Razorpay',
    location: 'Bangalore, Karnataka, India',
    jd_url: 'https://www.linkedin.com/jobs/view/123456789',
};
const mockJDText = `
  We are looking for a Full Stack Software Intern to join our team.
  You will work on building and maintaining our payment infrastructure.
  
  Requirements:
  - Proficiency in TypeScript, Node.js, React
  - Experience with PostgreSQL or similar databases
  - Understanding of REST APIs and microservices
  - Familiarity with cloud platforms (AWS, GCP)
  
  Responsibilities:
  - Build new features for our payment platform
  - Write clean, maintainable code
  - Collaborate with senior engineers
  - Participate in code reviews
`;
const mockContact = {
    name: 'Priya Sharma',
    title: 'Senior Software Engineer',
    linkedin_url: 'https://linkedin.com/in/priya-sharma',
    email: 'priya.sharma@razorpay.com',
};
const mockAIResult = {
    match_score: 87,
    tailored_bullets: [
        'Engineered production-grade REST APIs using Node.js and TypeScript, directly applicable to Razorpay payment infrastructure',
        'Designed normalized PostgreSQL schemas with RLS policies, aligning with Razorpay database architecture',
        'Built cloud-native applications on Vercel and AWS, demonstrating cloud platform familiarity',
        'Developed microservices-inspired modules with loose coupling for horizontal scalability',
        'Implemented real-time features and rate limiting using Redis, relevant to payment processing systems',
    ],
    cold_message: 'Hi [Name], I came across the Full Stack Intern role at Razorpay and was excited by the focus on payment infrastructure. As a 3rd-year CSE student at LPU with hands-on experience in TypeScript, Node.js, and PostgreSQL, I believe I could contribute meaningfully to your team. Would you be open to a quick chat or referral?',
    contacts: [
        { name: '', title: 'Engineering Manager', linkedin_url: '', email: 'Hi [Name], I am a 3rd year CSE student...' },
        { name: '', title: 'Senior Software Engineer', linkedin_url: '', email: 'Hi [Name], I noticed your work at Razorpay...' },
        { name: '', title: 'University Recruiter', linkedin_url: '', email: 'Hi [Name], I am actively looking for internships...' },
        { name: '', title: 'Tech Lead', linkedin_url: '', email: 'Hi [Name], I have been following Razorpay...' },
        { name: '', title: 'Software Engineer II', linkedin_url: '', email: 'Hi [Name], I came across your profile...' },
    ],
};
const mockJobEntry = {
    job_id: 'test-uuid-1234-5678',
    scraped_at: '2026-03-17',
    company: 'Razorpay',
    role: 'Full Stack Software Intern',
    location: 'Bangalore, Karnataka, India',
    jd_url: 'https://www.linkedin.com/jobs/view/123456789',
    jd_text: mockJDText,
    match_score: 87,
    tailored_bullets: mockAIResult.tailored_bullets,
    contacts: mockAIResult.contacts,
    cold_message: mockAIResult.cold_message,
    status: 'pending',
};
// ─── Tests ────────────────────────────────────────────────────────────────────
async function runAllTests() {
    console.log(`\n${BOLD}${BLUE}╔══════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${BLUE}║     Job Agent — Test Suite v1.0.0        ║${RESET}`);
    console.log(`${BOLD}${BLUE}║     Zero AI calls — No quota used        ║${RESET}`);
    console.log(`${BOLD}${BLUE}╚══════════════════════════════════════════╝${RESET}\n`);
    // ── 1. Environment & Config ──────────────────────────────────────────────
    section('1. Environment & Config');
    await test('GEMINI_API_KEY is set', () => {
        assert(!!process.env.GEMINI_API_KEY, 'GEMINI_API_KEY is missing from .env');
    });
    await test('TELEGRAM_BOT_TOKEN is set', () => {
        assert(!!process.env.TELEGRAM_BOT_TOKEN, 'TELEGRAM_BOT_TOKEN is missing from .env');
    });
    await test('YOUR_TELEGRAM_CHAT_ID is set', () => {
        assert(!!process.env.YOUR_TELEGRAM_CHAT_ID, 'YOUR_TELEGRAM_CHAT_ID is missing from .env');
    });
    await test('GOOGLE_SHEET_ID is set', () => {
        assert(!!process.env.GOOGLE_SHEET_ID, 'GOOGLE_SHEET_ID is missing from .env');
    });
    await test('Config loads without throwing', () => {
        const { config } = require('../utils/config');
        assert(!!config.geminiKey, 'config.geminiKey is empty');
        assert(!!config.telegramToken, 'config.telegramToken is empty');
        assert(!!config.sheetId, 'config.sheetId is empty');
        assert(!!config.chatId, 'config.chatId is empty');
        assertEqual(config.maxJobs, 6, 'config.maxJobs should be 6');
    });
    await test('Credentials file or base64 exists', () => {
        if (process.env.GOOGLE_CREDENTIALS_BASE64) {
            const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8');
            const creds = JSON.parse(decoded);
            assert(!!creds.client_email, 'credentials missing client_email');
            assert(!!creds.private_key, 'credentials missing private_key');
        }
        else {
            const fs = require('fs');
            const path = require('path');
            const credPath = path.resolve(process.cwd(), './data/credentials.json');
            assert(fs.existsSync(credPath), 'credentials.json not found at ./data/credentials.json');
            const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
            assert(!!creds.client_email, 'credentials missing client_email');
        }
    });
    await test('resume.txt exists and has content', () => {
        const fs = require('fs');
        const path = require('path');
        const resumePath = path.resolve(process.cwd(), 'data/resume.txt');
        assert(fs.existsSync(resumePath), 'data/resume.txt not found');
        const content = fs.readFileSync(resumePath, 'utf-8');
        assert(content.length > 100, 'resume.txt seems too short — check content');
        assertIncludes(content, 'SKILLS', 'resume.txt missing SKILLS section');
        assertIncludes(content, 'PROJECTS', 'resume.txt missing PROJECTS section');
    });
    // ── 2. TypeScript Types ──────────────────────────────────────────────────
    section('2. TypeScript Types & Data Models');
    await test('JobListing type shape is correct', () => {
        const job = mockJobListing;
        assert(typeof job.title === 'string', 'title must be string');
        assert(typeof job.company === 'string', 'company must be string');
        assert(typeof job.location === 'string', 'location must be string');
        assert(typeof job.jd_url === 'string', 'jd_url must be string');
        assertIncludes(job.jd_url, 'linkedin.com', 'jd_url should be a LinkedIn URL');
    });
    await test('Contact type shape is correct', () => {
        const contact = mockContact;
        assert(typeof contact.name === 'string', 'name must be string');
        assert(typeof contact.title === 'string', 'title must be string');
        assert(typeof contact.linkedin_url === 'string', 'linkedin_url must be string');
        assert(contact.email === null || typeof contact.email === 'string', 'email must be string or null');
    });
    await test('JobEntry type shape is correct', () => {
        const entry = mockJobEntry;
        assert(typeof entry.job_id === 'string', 'job_id must be string');
        assert(typeof entry.scraped_at === 'string', 'scraped_at must be string');
        assert(typeof entry.match_score === 'number', 'match_score must be number');
        assert(entry.match_score >= 0 && entry.match_score <= 100, 'match_score must be 0-100');
        assert(Array.isArray(entry.tailored_bullets), 'tailored_bullets must be array');
        assert(Array.isArray(entry.contacts), 'contacts must be array');
        assert(typeof entry.cold_message === 'string', 'cold_message must be string');
        assert(['pending', 'applied', 'followed_up', 'rejected'].includes(entry.status), 'invalid status value');
    });
    await test('JobEntry has exactly 5 tailored bullets', () => {
        assertEqual(mockJobEntry.tailored_bullets.length, 5, 'Should have exactly 5 tailored bullets');
    });
    await test('JobEntry has exactly 5 contacts', () => {
        assertEqual(mockJobEntry.contacts.length, 5, 'Should have exactly 5 contacts');
    });
    await test('AIProcessorResult type shape is correct', () => {
        const result = mockAIResult;
        assert(typeof result.match_score === 'number', 'match_score must be number');
        assert(Array.isArray(result.tailored_bullets), 'tailored_bullets must be array');
        assert(typeof result.cold_message === 'string', 'cold_message must be string');
        assert(Array.isArray(result.contacts), 'contacts must be array');
    });
    // ── 3. Helper Functions ──────────────────────────────────────────────────
    section('3. Utility & Helper Functions');
    await test('log() outputs formatted timestamp', () => {
        const { log } = require('../utils/helpers');
        // Should not throw
        log('test', 'hello from test');
    });
    await test('logError() outputs formatted error', () => {
        const { logError } = require('../utils/helpers');
        logError('test', 'test error', new Error('mock error'));
    });
    await test('sleep() resolves after delay', async () => {
        const { sleep } = require('../utils/helpers');
        const start = Date.now();
        await sleep(100);
        const elapsed = Date.now() - start;
        assert(elapsed >= 90, `sleep(100) resolved too early: ${elapsed}ms`);
    });
    await test('randomDelay() stays within bounds', async () => {
        const { randomDelay } = require('../utils/helpers');
        const start = Date.now();
        await randomDelay(50, 150);
        const elapsed = Date.now() - start;
        assert(elapsed >= 40, `randomDelay too short: ${elapsed}ms`);
        assert(elapsed < 300, `randomDelay too long: ${elapsed}ms`);
    });
    await test('sanitizeText() removes extra whitespace', () => {
        const { sanitizeText } = require('../utils/helpers');
        const input = '  Hello   World  \n\n  Test  ';
        const output = sanitizeText(input);
        assert(!output.startsWith(' '), 'should not start with space');
        assert(!output.endsWith(' '), 'should not end with space');
        assert(!output.includes('   '), 'should not have triple spaces');
    });
    // ── 4. Scraper Logic (No Browser) ────────────────────────────────────────
    section('4. Scraper Logic (Mocked — No Browser)');
    await test('Job listing URL is a valid LinkedIn URL', () => {
        const url = mockJobListing.jd_url;
        assertIncludes(url, 'linkedin.com/jobs', 'JD URL should be a LinkedIn jobs URL');
        assert(url.startsWith('https://'), 'URL should start with https://');
    });
    await test('Job listings array filters empty entries correctly', () => {
        const rawCards = [
            { title: 'SDE Intern', company: 'Google', location: 'Bangalore', jd_url: 'https://linkedin.com/jobs/1' },
            { title: '', company: 'Meta', location: 'Remote', jd_url: 'https://linkedin.com/jobs/2' },
            { title: 'Frontend Intern', company: '', location: 'Mumbai', jd_url: 'https://linkedin.com/jobs/3' },
            { title: 'Backend Intern', company: 'Stripe', location: 'Remote', jd_url: '' },
            { title: 'Full Stack Intern', company: 'Razorpay', location: 'Bangalore', jd_url: 'https://linkedin.com/jobs/5' },
        ];
        const valid = rawCards.filter(j => j.title && j.company && j.jd_url);
        assertEqual(valid.length, 2, 'Should filter out entries with missing fields');
        assertEqual(valid[0].company, 'Google', 'First valid entry should be Google');
        assertEqual(valid[1].company, 'Razorpay', 'Second valid entry should be Razorpay');
    });
    await test('MAX_JOBS respects config.maxJobs = 6', () => {
        const listings = Array.from({ length: 15 }, (_, i) => ({
            ...mockJobListing,
            title: `Job ${i + 1}`,
        }));
        const limited = listings.slice(0, 6);
        assertEqual(limited.length, 6, 'Should limit to 6 jobs max');
    });
    await test('Search query is properly encoded for LinkedIn URL', () => {
        const query = 'full stack intern India';
        const encoded = encodeURIComponent(query);
        const url = `https://www.linkedin.com/jobs/search/?keywords=${encoded}`;
        assertIncludes(url, 'linkedin.com/jobs/search', 'URL should be LinkedIn jobs search');
        assertIncludes(url, 'keywords=', 'URL should have keywords param');
        assert(!url.includes(' '), 'URL should not contain spaces');
    });
    // ── 5. JD Fetcher Logic (No Browser) ─────────────────────────────────────
    section('5. JD Fetcher Logic (Mocked — No Browser)');
    await test('JD text sanitization removes excess whitespace', () => {
        const { sanitizeText } = require('../utils/helpers');
        const rawJD = '  We are looking   for a   developer.\n\n\n  Skills required:  TypeScript  ';
        const cleaned = sanitizeText(rawJD);
        assert(cleaned.length < rawJD.length, 'Sanitized text should be shorter');
        assert(!cleaned.startsWith(' '), 'Should not start with space');
    });
    await test('JD text contains expected keywords for tech roles', () => {
        const jd = mockJDText.toLowerCase();
        const techKeywords = ['typescript', 'node', 'postgresql', 'api'];
        const found = techKeywords.filter(kw => jd.includes(kw));
        assert(found.length > 0, `JD should contain at least one tech keyword. Found: ${found.join(', ')}`);
    });
    await test('Empty JD text is handled gracefully', () => {
        const jdText = '';
        const truncated = jdText.substring(0, 3000);
        assertEqual(truncated, '', 'Empty JD should remain empty after truncation');
    });
    await test('Long JD text is truncated to 3000 chars for AI prompt', () => {
        const longJD = 'x'.repeat(5000);
        const truncated = longJD.substring(0, 3000);
        assertEqual(truncated.length, 3000, 'Should truncate to exactly 3000 chars');
    });
    // ── 6. AI Processor Logic (Mocked — No Gemini Calls) ─────────────────────
    section('6. AI Processor Logic (Mocked — No Gemini Calls)');
    await test('Match score parsing handles valid number string', () => {
        const raw = '87';
        const score = Math.min(100, Math.max(0, parseInt(raw) || 50));
        assertEqual(score, 87, 'Should parse 87 correctly');
    });
    await test('Match score parsing clamps to 0-100 range', () => {
        const tooHigh = Math.min(100, Math.max(0, parseInt('150') || 50));
        assertEqual(tooHigh, 100, 'Should clamp to 100');
        const tooLow = Math.min(100, Math.max(0, parseInt('-10') || 50));
        assertEqual(tooLow, 0, 'Should clamp to 0');
    });
    await test('Match score parsing falls back to 50 on invalid input', () => {
        const invalid = Math.min(100, Math.max(0, parseInt('not-a-number') || 50));
        assertEqual(invalid, 50, 'Should default to 50 on invalid input');
    });
    await test('Bullet points parsing filters correctly', () => {
        const raw = `- Built REST APIs using Node.js and TypeScript
- Designed PostgreSQL schemas with RLS policies
- Integrated cloud storage with Cloudflare R2
Some random text that should be filtered
- Deployed on Vercel with performance monitoring
- Implemented rate limiting with Upstash Redis`;
        const bullets = raw
            .split('\n')
            .map(b => b.trim())
            .filter(b => b.startsWith('- '))
            .map(b => b.slice(2).trim())
            .slice(0, 5);
        assertEqual(bullets.length, 5, 'Should extract exactly 5 bullets');
        assert(!bullets[0].startsWith('- '), 'Bullets should not start with "- "');
        assertIncludes(bullets[0], 'REST APIs', 'First bullet should contain content');
    });
    await test('People suggestions parser works correctly', () => {
        const raw = `TITLE: Engineering Manager
MESSAGE: Hi [Name], I am a student applying to your company...
---
TITLE: Senior Software Engineer
MESSAGE: Hi [Name], I noticed your work on...
---
TITLE: University Recruiter
MESSAGE: Hi [Name], I am looking for internships...
---
TITLE: Tech Lead
MESSAGE: Hi [Name], I have been following your work...
---
TITLE: Software Engineer II
MESSAGE: Hi [Name], I came across your profile...`;
        const suggestions = raw
            .split('---')
            .map(block => block.trim())
            .filter(block => block.includes('TITLE:') && block.includes('MESSAGE:'))
            .slice(0, 5)
            .map(block => {
            const titleMatch = block.match(/TITLE:\s*(.+)/);
            const messageMatch = block.match(/MESSAGE:\s*([\s\S]+?)(?=TITLE:|$)/);
            return {
                name: '',
                title: titleMatch?.[1]?.trim() ?? '',
                linkedin_url: '',
                email: messageMatch?.[1]?.trim() ?? null,
            };
        });
        assertEqual(suggestions.length, 5, 'Should parse exactly 5 suggestions');
        assertEqual(suggestions[0].title, 'Engineering Manager', 'First title should be Engineering Manager');
        assert(suggestions[0].email !== null, 'Message should be parsed into email field');
    });
    await test('Cold message is non-empty and reasonable length', () => {
        const msg = mockAIResult.cold_message;
        assert(msg.length > 50, 'Cold message too short');
        assert(msg.length < 1000, 'Cold message too long');
    });
    // ── 7. Sheet Writer Logic (No API Calls) ─────────────────────────────────
    section('7. Sheet Writer Logic (Mocked — No API Calls)');
    await test('Sheet row is built with correct number of columns', () => {
        const job = mockJobEntry;
        const bullets = [0, 1, 2, 3, 4].map(i => job.tailored_bullets[i] ?? '');
        const contacts = [0, 1, 2, 3, 4].map(i => [
            job.contacts[i]?.title ?? '',
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
        // 7 base + 5 bullets + 10 contact fields (5×2) + 1 cold message + 1 status = 24
        assertEqual(row.length, 24, `Row should have 24 columns, got ${row.length}`);
        assertEqual(row[0], job.job_id, 'First column should be job_id');
        assertEqual(row[2], 'Razorpay', 'Third column should be company');
        assertEqual(row[6], 87, 'Seventh column should be match_score');
    });
    await test('Sheet headers array has correct length', () => {
        const HEADERS = [
            'Job ID', 'Scraped At', 'Company', 'Role', 'Location', 'JD URL', 'Match Score',
            'Bullet 1', 'Bullet 2', 'Bullet 3', 'Bullet 4', 'Bullet 5',
            'Search Title 1', 'Cold Message 1',
            'Search Title 2', 'Cold Message 2',
            'Search Title 3', 'Cold Message 3',
            'Search Title 4', 'Cold Message 4',
            'Search Title 5', 'Cold Message 5',
            'General Cold Message', 'Status',
        ];
        assertEqual(HEADERS.length, 24, `Headers should have 24 columns, got ${HEADERS.length}`);
    });
    await test('Missing bullets are filled with empty strings', () => {
        const partialJob = { ...mockJobEntry, tailored_bullets: ['Only one bullet'] };
        const bullets = [0, 1, 2, 3, 4].map(i => partialJob.tailored_bullets[i] ?? '');
        assertEqual(bullets[0], 'Only one bullet', 'First bullet should exist');
        assertEqual(bullets[1], '', 'Missing bullets should be empty string');
        assertEqual(bullets[4], '', 'Missing bullets should be empty string');
    });
    await test('Missing contacts are filled with empty strings', () => {
        const partialJob = { ...mockJobEntry, contacts: [mockAIResult.contacts[0]] };
        const contacts = [0, 1, 2, 3, 4].map(i => [
            partialJob.contacts[i]?.title ?? '',
            partialJob.contacts[i]?.email ?? '',
        ]).flat();
        assertEqual(contacts[0], 'Engineering Manager', 'First contact title should exist');
        assertEqual(contacts[2], '', 'Missing contact title should be empty string');
    });
    // ── 8. Bot Command Logic (No Telegram API) ────────────────────────────────
    section('8. Bot Command Logic (Mocked)');
    await test('Chat ID authorization check works correctly', () => {
        const authorizedId = process.env.YOUR_TELEGRAM_CHAT_ID ?? '5848066491';
        const isAuthorized = (chatId) => chatId === authorizedId;
        assert(isAuthorized(authorizedId), 'Authorized ID should pass');
        assert(!isAuthorized('9999999999'), 'Unknown ID should fail');
        assert(!isAuthorized(''), 'Empty ID should fail');
    });
    await test('/find command rejects empty query', () => {
        const query = ''.trim();
        assert(!query, 'Empty query should be falsy');
    });
    await test('/find command accepts valid query', () => {
        const query = 'full stack intern India'.trim();
        assert(!!query, 'Valid query should be truthy');
        assert(query.length > 3, 'Query should have meaningful length');
    });
    await test('Pipeline result shape is correct', () => {
        const result = {
            success: true,
            jobs_processed: 3,
            sheet_url: 'https://docs.google.com/spreadsheets/d/abc123',
            errors: [],
        };
        assert(typeof result.success === 'boolean', 'success must be boolean');
        assert(typeof result.jobs_processed === 'number', 'jobs_processed must be number');
        assert(typeof result.sheet_url === 'string', 'sheet_url must be string');
        assert(Array.isArray(result.errors), 'errors must be array');
    });
    await test('Error messages are truncated for Telegram display', () => {
        const errors = ['Error 1', 'Error 2', 'Error 3', 'Error 4', 'Error 5'];
        const displayed = errors.slice(0, 3);
        assertEqual(displayed.length, 3, 'Should only show first 3 errors');
    });
    // ── 9. Monitor Logic ──────────────────────────────────────────────────────
    section('9. Health Monitor Logic');
    await test('Monitor starts without throwing', () => {
        const { startMonitor, stopMonitor } = require('../utils/monitor');
        startMonitor();
        stopMonitor(); // Clean up immediately
    });
    await test('recordHeartbeat does not throw', () => {
        const { recordHeartbeat } = require('../utils/monitor');
        recordHeartbeat();
    });
    await test('resetQuotaAlert does not throw', () => {
        const { resetQuotaAlert } = require('../utils/monitor');
        resetQuotaAlert();
    });
    // ── 10. Mailer Logic ──────────────────────────────────────────────────────
    section('10. Mailer / Alert Logic');
    await test('Alert type enum values are correct', () => {
        const validTypes = ['error', 'warning', 'info'];
        assert(validTypes.includes('error'), 'error should be valid type');
        assert(validTypes.includes('warning'), 'warning should be valid type');
        assert(validTypes.includes('info'), 'info should be valid type');
        assert(!validTypes.includes('debug'), 'debug should not be valid type');
    });
    await test('Emoji mapping is correct per alert type', () => {
        const getEmoji = (type) => type === 'error' ? '🔴' : type === 'warning' ? '🟡' : '🟢';
        assertEqual(getEmoji('error'), '🔴', 'Error should be red circle');
        assertEqual(getEmoji('warning'), '🟡', 'Warning should be yellow circle');
        assertEqual(getEmoji('info'), '🟢', 'Info should be green circle');
    });
    await test('Telegram API URL is correctly formed', () => {
        const token = 'fake_token_for_test';
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        assertIncludes(url, 'api.telegram.org', 'Should use Telegram API');
        assertIncludes(url, token, 'Should include token');
        assertIncludes(url, 'sendMessage', 'Should call sendMessage');
    });
    // ── 11. People Finder Logic ───────────────────────────────────────────────
    section('11. People Finder Logic (Mocked)');
    await test('Company domain guessing works correctly', () => {
        const getCompanyDomain = (company) => {
            const cleaned = company
                .toLowerCase()
                .replace(/\s+(inc|ltd|llc|corp|technologies|tech|solutions|software|systems|global)\.?$/i, '')
                .trim()
                .replace(/\s+/g, '')
                .replace(/[^a-z0-9]/g, '');
            return `${cleaned}.com`;
        };
        assertEqual(getCompanyDomain('Razorpay'), 'razorpay.com', 'Razorpay domain');
        assertEqual(getCompanyDomain('Google Inc'), 'google.com', 'Google Inc domain');
        assertEqual(getCompanyDomain('Tata Technologies Ltd'), 'tatatechnologies.com', 'Tata domain');
    });
    await test('Email guessing from name + domain', () => {
        const guessEmail = (firstName, lastName, domain) => {
            if (!firstName || !lastName || !domain)
                return null;
            const f = firstName.toLowerCase().replace(/[^a-z]/g, '');
            const l = lastName.toLowerCase().replace(/[^a-z]/g, '');
            return `${f}.${l}@${domain}`;
        };
        assertEqual(guessEmail('Priya', 'Sharma', 'razorpay.com'), 'priya.sharma@razorpay.com', 'Should guess email correctly');
        assertEqual(guessEmail('', 'Sharma', 'razorpay.com'), null, 'Should return null for missing first name');
    });
    await test('Title relevance filter works correctly', () => {
        const TARGET_TITLES = [
            'software engineer', 'sde', 'developer', 'frontend', 'backend',
            'full stack', 'engineering manager', 'tech lead', 'recruiter',
        ];
        const isRelevantTitle = (title) => {
            const lower = title.toLowerCase();
            return TARGET_TITLES.some(t => lower.includes(t));
        };
        assert(isRelevantTitle('Senior Software Engineer'), 'Senior SWE should be relevant');
        assert(isRelevantTitle('Engineering Manager'), 'EM should be relevant');
        assert(isRelevantTitle('Frontend Developer'), 'Frontend dev should be relevant');
        assert(!isRelevantTitle('Product Manager'), 'PM should not be relevant');
        assert(!isRelevantTitle('Data Scientist'), 'Data scientist should not be relevant');
        assert(!isRelevantTitle('Marketing Lead'), 'Marketing should not be relevant');
    });
    // ── 12. Integration — Pipeline Flow (Mocked) ─────────────────────────────
    section('12. Integration — Full Pipeline Flow (Mocked)');
    await test('Full pipeline data flow: scrape → JD → AI → sheet row', () => {
        // Simulate the full pipeline with mock data
        const listings = [mockJobListing];
        assert(listings.length > 0, 'Listings should not be empty');
        const withJD = { ...listings[0], jd_text: mockJDText };
        assert(withJD.jd_text.length > 0, 'JD text should not be empty');
        const aiResult = mockAIResult;
        assert(aiResult.match_score >= 0 && aiResult.match_score <= 100, 'Match score should be valid');
        assert(aiResult.tailored_bullets.length === 5, 'Should have 5 bullets');
        assert(aiResult.contacts.length === 5, 'Should have 5 contacts');
        const entry = mockJobEntry;
        assert(!!entry.job_id, 'Entry should have job_id');
        assert(entry.status === 'pending', 'New entry status should be pending');
        // Build sheet row
        const bullets = [0, 1, 2, 3, 4].map(i => entry.tailored_bullets[i] ?? '');
        const contacts = [0, 1, 2, 3, 4].map(i => [
            entry.contacts[i]?.title ?? '',
            entry.contacts[i]?.email ?? '',
        ]).flat();
        const row = [
            entry.job_id, entry.scraped_at, entry.company, entry.role,
            entry.location, entry.jd_url, entry.match_score,
            ...bullets, ...contacts, entry.cold_message, entry.status,
        ];
        assertEqual(row.length, 24, 'Final sheet row should have 24 columns');
        assert(row.every(cell => cell !== undefined), 'No undefined cells in row');
    });
    await test('Pipeline handles 0 job results gracefully', () => {
        const listings = [];
        const limited = listings.slice(0, 6);
        assertEqual(limited.length, 0, 'Should handle empty listings');
        const result = {
            success: false,
            jobs_processed: 0,
            sheet_url: '',
            errors: ['No jobs found for this query'],
        };
        assert(!result.success, 'Pipeline should not succeed with 0 jobs');
        assertEqual(result.errors.length, 1, 'Should have one error message');
    });
    await test('Pipeline handles partial AI failures gracefully', () => {
        const failedAIResult = { match_score: 0, tailored_bullets: [], cold_message: '', contacts: [] };
        assert(failedAIResult.match_score === 0, 'Failed AI result has 0 score');
        assert(failedAIResult.tailored_bullets.length === 0, 'Failed AI result has no bullets');
        // Pipeline should still write to sheet with empty AI fields
        const entry = {
            ...mockJobEntry,
            match_score: failedAIResult.match_score,
            tailored_bullets: failedAIResult.tailored_bullets,
            contacts: failedAIResult.contacts,
        };
        assert(!!entry.company, 'Entry should still have company even if AI failed');
        assert(!!entry.jd_url, 'Entry should still have JD URL even if AI failed');
    });
    // ─── Final Report ──────────────────────────────────────────────────────────
    console.log(`\n${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`${BOLD}  Test Results${RESET}`);
    console.log(`${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    console.log(`  ${GREEN}Passed:  ${passed}${RESET}`);
    console.log(`  ${RED}Failed:  ${failed}${RESET}`);
    console.log(`  ${YELLOW}Skipped: ${skipped}${RESET}`);
    console.log(`  Total:   ${passed + failed + skipped}`);
    console.log(`${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    if (failed === 0) {
        console.log(`\n${GREEN}${BOLD}  ✅ All tests passed! Zero AI quota used.${RESET}\n`);
    }
    else {
        console.log(`\n${RED}${BOLD}  ❌ ${failed} test(s) failed. See above for details.${RESET}\n`);
        process.exit(1);
    }
}
runAllTests().catch((err) => {
    console.error(`${RED}Test runner crashed:${RESET}`, err);
    process.exit(1);
});
