// src/modules/people-finder.ts

import { chromium } from 'playwright';
import { Contact } from '../types';
import { log, logError, randomDelay, sanitizeText } from '../utils/helpers';

const TARGET_TITLES = [
  'software engineer', 'sde', 'developer', 'frontend', 'backend',
  'full stack', 'engineering manager', 'tech lead', 'recruiter',
  'talent acquisition', 'hiring'
];

function guessEmail(firstName: string, lastName: string, domain: string): string | null {
  if (!firstName || !lastName || !domain) return null;
  const f = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const l = lastName.toLowerCase().replace(/[^a-z]/g, '');
  // Most common corporate email pattern
  return `${f}.${l}@${domain}`;
}

function getCompanyDomain(company: string): string {
  // Clean company name to guess domain
  const cleaned = company
    .toLowerCase()
    .replace(/\s+(inc|ltd|llc|corp|technologies|tech|solutions|software)\.?$/i, '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  return `${cleaned}.com`;
}

function isRelevantTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return TARGET_TITLES.some(t => lower.includes(t));
}

export async function findContacts(company: string): Promise<Contact[]> {
  log('people', `Finding contacts at: ${company}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const contacts: Contact[] = [];
  const domain = getCompanyDomain(company);

  try {
    const page = await context.newPage();

    // Google search for LinkedIn profiles at this company
    const searchQuery = encodeURIComponent(
      `site:linkedin.com/in/ "${company}" software engineer OR developer OR recruiter`
    );
    const googleUrl = `https://www.google.com/search?q=${searchQuery}&num=10`;

    log('people', `Searching Google for LinkedIn profiles...`);
    await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await randomDelay(2000, 3000);

    // Extract LinkedIn profile URLs from Google results
    const profileUrls = await page.$$eval('a[href*="linkedin.com/in/"]', (links) =>
      links
        .map((l: any) => String(l?.href ?? ''))
        .filter(href => href.includes('linkedin.com/in/'))
        .map(href => {
          // Clean Google redirect URLs
          const match = href.match(/linkedin\.com\/in\/[^&"'\s/]+/);
          return match ? `https://www.${match[0]}` : null;
        })
        .filter(Boolean)
        .slice(0, 8)
    ) as string[];

    log('people', `Found ${profileUrls.length} LinkedIn profile URLs`);

    // Visit each profile and extract info
    for (const profileUrl of profileUrls) {
      if (contacts.length >= 5) break;

      try {
        await randomDelay(2000, 4000);
        const profilePage = await context.newPage();

        await profilePage.goto(profileUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });
        await randomDelay(1500, 2500);

        // Extract profile text using Playwright locators to avoid DOM globals in TS
        const name = (await profilePage.locator('h1').first().textContent().catch(() => null))?.trim() ?? '';
        const title = (await profilePage.locator('.text-body-medium').first().textContent().catch(() => null))?.trim() ?? '';

        const profileData = {
          name,
          title,
        };

        await profilePage.close();

        if (!profileData.name || !profileData.title) continue;
        if (!isRelevantTitle(profileData.title)) continue;

        // Guess email from name + domain
        const nameParts = profileData.name.trim().split(' ');
        const firstName = nameParts[0] ?? '';
        const lastName = nameParts[nameParts.length - 1] ?? '';
        const email = guessEmail(firstName, lastName, domain);

        contacts.push({
          name: profileData.name,
          title: profileData.title,
          linkedin_url: profileUrl,
          email,
        });

        log('people', `✅ Found: ${profileData.name} — ${profileData.title}`);

      } catch {
        // Profile failed to load — skip it
        continue;
      }
    }

    log('people', `Found ${contacts.length} relevant contacts at ${company}`);

  } catch (error) {
    logError('people', `Failed to find contacts for ${company}`, error);
  } finally {
    await browser.close();
  }

  return contacts;
}