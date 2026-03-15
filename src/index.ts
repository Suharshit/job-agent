// src/index.ts

import dotenv from 'dotenv';
dotenv.config();

import { log, logError } from './utils/helpers';
import { PipelineResult } from './types';

export async function runPipeline(query: string): Promise<PipelineResult> {
  log('pipeline', `Starting job hunt for: "${query}"`);

  const result: PipelineResult = {
    success: false,
    jobs_processed: 0,
    sheet_url: process.env.GOOGLE_SHEET_URL ?? '',
    errors: [],
  };

  try {
    // Phase 3: Scrape job listings
    log('pipeline', 'Step 1/5 — Scraping job listings...');
    // const listings = await scrapeJobs(query);

    // Phase 3: Fetch full JDs
    log('pipeline', 'Step 2/5 — Fetching job descriptions...');
    // const jobsWithJD = await fetchAllJDs(listings);

    // Phase 4: AI processing
    log('pipeline', 'Step 3/5 — Running AI processor...');
    // const processed = await processAllJobs(jobsWithJD);

    // Phase 5: People finder
    log('pipeline', 'Step 4/5 — Finding contacts...');
    // const withContacts = await findAllContacts(processed);

    // Phase 4: Write to sheet
    log('pipeline', 'Step 5/5 — Writing to Google Sheet...');
    // await writeAllToSheet(withContacts);

    result.success = true;
    log('pipeline', '✅ Pipeline complete!');
  } catch (error) {
    logError('pipeline', 'Pipeline failed', error);
    result.errors.push(String(error));
  }

  return result;
}

// Run directly if called from command line
const query = process.argv[2];
if (query) {
  runPipeline(query).then(result => {
    console.log('\n📊 Result:', result);
  });
}