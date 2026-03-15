// src/test.ts

import dotenv from 'dotenv';
dotenv.config();

import { log, logError } from './utils/helpers';
import { scrapeJobs } from './modules/scraper';
import { fetchJD } from './modules/jd-fetcher';

async function test() {
  log('test', '--- Phase 3: Scraper + JD Fetcher Test ---');

  // Test 1: Scrape jobs
  log('test', 'Testing job scraper...');
  const jobs = await scrapeJobs('software engineer intern');

  if (jobs.length === 0) {
    logError('test', 'Scraper returned 0 jobs — check selectors or network');
    return;
  }

  log('test', `✅ Scraper found ${jobs.length} jobs`);
  log('test', `First job: ${jobs[0].company} — ${jobs[0].title}`);
  log('test', `URL: ${jobs[0].jd_url}`);

  // Test 2: Fetch one JD
  log('test', 'Testing JD fetcher on first result...');
  const jdText = await fetchJD(jobs[0].jd_url);

  if (!jdText) {
    logError('test', 'JD fetcher returned empty text — check selectors');
    return;
  }

  log('test', `✅ JD fetched — ${jdText.length} characters`);
  log('test', `Preview: ${jdText.substring(0, 150)}...`);
  log('test', '--- Phase 3 checks passed ✅ ---');
}

test().catch(console.error);