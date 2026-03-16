import dotenv from 'dotenv';
dotenv.config();

import { log } from './utils/helpers';
import { runPipeline } from './index';

async function test() {
  log('test', '--- Phase 5 Full Pipeline Test ---');
  const result = await runPipeline('software engineer intern India');
  log('test', `Success: ${result.success}`);
  log('test', `Jobs processed: ${result.jobs_processed}`);
  if (result.errors.length > 0) {
    log('test', `Errors: ${result.errors.join(', ')}`);
  }
  log('test', '--- Done ---');
}

test().catch(console.error);