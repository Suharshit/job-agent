"use strict";
// src/modules/jd-fetcher.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchJD = fetchJD;
exports.fetchAllJDs = fetchAllJDs;
const playwright_1 = require("playwright");
const helpers_1 = require("../utils/helpers");
async function fetchJD(jd_url) {
    const browser = await playwright_1.chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // ← add this
            '--disable-gpu', // ← add this
            '--single-process', // ← add this for low memory
        ],
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    try {
        await page.goto(jd_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await (0, helpers_1.randomDelay)(2000, 3000);
        // Click "See more" button if it exists
        try {
            await page.click('.show-more-less-html__button--more', { timeout: 3000 });
            await (0, helpers_1.randomDelay)(500, 1000);
        }
        catch {
            // Button doesn't exist — full JD already visible
        }
        // Extract the job description text
        const jdText = await page.$eval('.show-more-less-html__markup', (el) => el.textContent ?? '').catch(async () => {
            // Fallback selector
            return await page.$eval('.description__text', (el) => el.textContent ?? '').catch(() => '');
        });
        return (0, helpers_1.sanitizeText)(jdText);
    }
    catch (error) {
        (0, helpers_1.logError)('jd-fetcher', `Failed to fetch JD from ${jd_url}`, error);
        return '';
    }
    finally {
        await browser.close();
    }
}
async function fetchAllJDs(listings) {
    (0, helpers_1.log)('jd-fetcher', `Fetching JDs for ${listings.length} jobs...`);
    const results = [];
    for (let i = 0; i < listings.length; i++) {
        const job = listings[i];
        (0, helpers_1.log)('jd-fetcher', `Fetching JD ${i + 1}/${listings.length}: ${job.company} — ${job.title}`);
        const jd_text = await fetchJD(job.jd_url);
        results.push({ ...job, jd_text });
        await (0, helpers_1.randomDelay)(2000, 4000); // Be polite to LinkedIn
    }
    (0, helpers_1.log)('jd-fetcher', `Done. Fetched ${results.filter(j => j.jd_text).length}/${listings.length} JDs successfully`);
    return results;
}
