"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
(async () => {
    const browser = await playwright_1.chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://html.duckduckgo.com/html/?q=site:linkedin.com/in+Razorpay+software+engineer');
    await page.waitForTimeout(4000);
    const links = await page.$$eval('a', (ls) => ls.map((l) => String(l?.href ?? '')).filter(h => h.includes('linkedin')));
    const bodyText = await page.$eval('body', (el) => String(el?.innerHTML ?? '').substring(0, 2000));
    console.log('Links found:', links.length);
    console.log('Sample links:', links.slice(0, 5));
    console.log('\nPage HTML preview:\n', bodyText);
    await browser.close();
})();
