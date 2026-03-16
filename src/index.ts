// src/index.ts

import dotenv from 'dotenv';
dotenv.config();

import { v4 as uuidv4 } from 'uuid';
import { log, logError, randomDelay } from './utils/helpers';
import { config } from './utils/config';
import { scrapeJobs } from './modules/scraper';
import { fetchAllJDs } from './modules/jd-fetcher';
import { processJob } from './modules/ai-processor';
import { initSheet, writeJobToSheet } from './modules/sheet-writer';
import { JobEntry, PipelineResult } from './types';

const MAX_JOBS = config.isDev ? 2 : config.maxJobs;

type ProgressCallback = (step: string) => Promise<void>;
const noOp: ProgressCallback = async () => {};

export async function runPipeline(
  query: string,
  onProgress: ProgressCallback = noOp
): Promise<PipelineResult> {
  log('pipeline', `🚀 Starting job hunt for: "${query}"`);

  const result: PipelineResult = {
    success: false,
    jobs_processed: 0,
    sheet_url: config.sheetUrl,
    errors: [],
  };

  try {
    // Step 1
    await onProgress('Step 1/4 — Scraping LinkedIn job listings...');
    log('pipeline', 'Step 1/4 — Scraping job listings...');
    const listings = await scrapeJobs(query);
    const limited = listings.slice(0, MAX_JOBS);
    log('pipeline', `Working with ${limited.length} jobs`);

    if (limited.length === 0) {
      result.errors.push('No jobs found for this query');
      return result;
    }

    // Step 2
    await onProgress(`Step 2/4 — Fetching ${limited.length} job descriptions...`);
    log('pipeline', 'Step 2/4 — Fetching job descriptions...');
    const withJDs = await fetchAllJDs(limited);

    // Step 3
    await onProgress('Step 3/4 — Setting up Google Sheet...');
    log('pipeline', 'Step 3/4 — Setting up Google Sheet...');
    await initSheet();

    // Step 4
    await onProgress(`Step 4/4 — AI processing ${withJDs.length} jobs...`);
    log('pipeline', 'Step 4/4 — AI processing and writing to sheet...');

    for (let i = 0; i < withJDs.length; i++) {
      const job = withJDs[i];
      log('pipeline', `Processing job ${i + 1}/${withJDs.length}: ${job.company}`);
      await onProgress(`🤖 Processing ${i + 1}/${withJDs.length}: ${job.company} — ${job.title}`);

      try {
        const aiResult = await processJob(job.company, job.title, job.jd_text);

        const entry: JobEntry = {
          job_id: uuidv4(),
          scraped_at: new Date().toISOString().split('T')[0],
          company: job.company,
          role: job.title,
          location: job.location,
          jd_url: job.jd_url,
          jd_text: job.jd_text,
          match_score: aiResult.match_score,
          tailored_bullets: aiResult.tailored_bullets,
          contacts: aiResult.contacts,
          cold_message: aiResult.cold_message,
          status: 'pending',
        };

        await writeJobToSheet(entry);
        result.jobs_processed++;
        await randomDelay(1000, 2000);

      } catch (jobError) {
        logError('pipeline', `Failed on job: ${job.company}`, jobError);
        result.errors.push(`${job.company}: ${jobError}`);
      }
    }

    result.success = true;
    log('pipeline', `✅ Done! ${result.jobs_processed} jobs written to sheet`);

  } catch (error) {
    logError('pipeline', 'Pipeline failed', error);
    result.errors.push(String(error));
  }

  return result;
}

// Run directly from command line
const query = process.argv[2];
if (query) {
  runPipeline(query).then(result => {
    console.log('\n📊 Result:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}