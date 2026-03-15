// src/test.ts

import dotenv from 'dotenv';
dotenv.config();

import { log } from './utils/helpers';
import { runPipeline } from './index';

async function test() {
  log('test', '--- Phase 4 Full Pipeline Test ---');
  log('test', 'Running in DEV mode — will process 3 jobs only');

  const result = await runPipeline('software engineer intern India');

  log('test', `Success: ${result.success}`);
  log('test', `Jobs processed: ${result.jobs_processed}`);
  log('test', `Sheet URL: ${result.sheet_url}`);

  if (result.errors.length > 0) {
    log('test', `Errors: ${result.errors.join(', ')}`);
  }

  log('test', '--- Phase 4 Test Complete ---');
}

test().catch(console.error);