"use strict";
// src/modules/scraper.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeJobs = scrapeJobs;
const playwright_1 = require("playwright");
const helpers_1 = require("../utils/helpers");
const config_1 = require("../utils/config");
async function scrapeJobs(query) {
    (0, helpers_1.log)('scraper', `Starting search for: "${query}"`);
    const browser = await playwright_1.chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    const listings = [];
    browser.on('disconnected', () => {
        (0, helpers_1.logError)('scraper', 'Browser disconnected unexpectedly');
    });
    page.on('crash', () => {
        (0, helpers_1.logError)('scraper', 'Page crashed unexpectedly');
    });
    page.on('close', () => {
        (0, helpers_1.log)('scraper', 'Page was closed');
    });
    try {
        const searchQuery = encodeURIComponent(query);
        const url = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}&position=1&pageNum=0`;
        (0, helpers_1.log)('scraper', `Opening LinkedIn Jobs...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await (0, helpers_1.randomDelay)(2000, 4000);
        // Scroll gradually and stop early if the page closes/crashes.
        for (let i = 0; i < 3; i++) {
            if (page.isClosed()) {
                throw new Error('Page was closed before scrolling completed');
            }
            await page.mouse.wheel(0, 800);
            // Fallback in case wheel events are blocked by overlays/interstitials.
            await page.evaluate(() => {
                globalThis.scrollBy?.(0, 800);
            });
            await (0, helpers_1.randomDelay)(1000, 2000);
        }
        // Extract job cards
        const jobCards = await page.$$eval('.job-search-card', (cards) => cards.map((card) => {
            const titleEl = card.querySelector('.base-search-card__title');
            const companyEl = card.querySelector('.base-search-card__subtitle');
            const locationEl = card.querySelector('.job-search-card__location');
            const linkEl = card.querySelector('a.base-card__full-link');
            return {
                title: titleEl?.textContent?.trim() ?? '',
                company: companyEl?.textContent?.trim() ?? '',
                location: locationEl?.textContent?.trim() ?? '',
                jd_url: linkEl?.getAttribute('href') ?? '',
            };
        }));
        // Filter out any incomplete cards
        const valid = jobCards
            .filter((j) => j.title && j.company && j.jd_url)
            .slice(0, config_1.config.maxJobs);
        listings.push(...valid);
        (0, helpers_1.log)('scraper', `Found ${listings.length} valid job listings`);
    }
    catch (error) {
        (0, helpers_1.logError)('scraper', 'Failed during scraping', error);
    }
    finally {
        await browser.close();
    }
    return listings;
}
