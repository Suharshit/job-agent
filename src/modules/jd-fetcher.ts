// src/modules/jd-fetcher.ts

import { chromium } from 'playwright';
import { JobListing } from '../types';
import { log, logError, randomDelay, sanitizeText } from '../utils/helpers';

export async function fetchJD(jd_url: string): Promise<string> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    await page.goto(jd_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await randomDelay(2000, 3000);

    // Click "See more" button if it exists
    try {
      await page.click('.show-more-less-html__button--more', { timeout: 3000 });
      await randomDelay(500, 1000);
    } catch {
      // Button doesn't exist — full JD already visible
    }

    // Extract the job description text
    const jdText = await page.$eval(
      '.show-more-less-html__markup',
      (el) => el.textContent ?? ''
    ).catch(async () => {
      // Fallback selector
      return await page.$eval(
        '.description__text',
        (el) => el.textContent ?? ''
      ).catch(() => '');
    });

    return sanitizeText(jdText);

  } catch (error) {
    logError('jd-fetcher', `Failed to fetch JD from ${jd_url}`, error);
    return '';
  } finally {
    await browser.close();
  }
}

export async function fetchAllJDs(
  listings: JobListing[]
): Promise<(JobListing & { jd_text: string })[]> {
  log('jd-fetcher', `Fetching JDs for ${listings.length} jobs...`);
  const results = [];

  for (let i = 0; i < listings.length; i++) {
    const job = listings[i];
    log('jd-fetcher', `Fetching JD ${i + 1}/${listings.length}: ${job.company} — ${job.title}`);

    const jd_text = await fetchJD(job.jd_url);

    results.push({ ...job, jd_text });
    await randomDelay(2000, 4000); // Be polite to LinkedIn
  }

  log('jd-fetcher', `Done. Fetched ${results.filter(j => j.jd_text).length}/${listings.length} JDs successfully`);
  return results;
}