# 🧩 pattern.md — Code Writing, Git Commits & Branch Ethics

> This document defines how code is written, committed, and branched in the job-agent project.
> Follow this consistently — even for a personal project. It builds habits that matter for real teams.

---

## 1. TypeScript Code Patterns

### Always type everything explicitly
```typescript
// ❌ Bad
const jobs = [];
async function scrape(query) { ... }

// ✅ Good
const jobs: JobEntry[] = [];
async function scrape(query: string): Promise<JobListing[]> { ... }
```

### Use interfaces from types/index.ts
Never define types inline inside a module file. Always import from `src/types/index.ts`.
```typescript
// ❌ Bad — type defined inside a module
async function processJob(job: { title: string; company: string }) { ... }

// ✅ Good — type imported from shared file
import { JobListing } from '../types';
async function processJob(job: JobListing): Promise<JobEntry> { ... }
```

### One responsibility per function
Each function does exactly one thing. If a function is doing two things, split it.
```typescript
// ❌ Bad — two responsibilities
async function scrapeAndFetchJD(query: string) {
  const jobs = await scrapeListings(query);
  for (const job of jobs) {
    job.jd_text = await fetchJD(job.jd_url);
  }
  return jobs;
}

// ✅ Good — each function does one thing
async function scrapeListings(query: string): Promise<JobListing[]> { ... }
async function fetchJD(url: string): Promise<string> { ... }
```

### Error handling with descriptive messages
```typescript
// ❌ Bad
try { ... } catch (e) { console.log(e); }

// ✅ Good
try {
  const jdText = await fetchJD(job.jd_url);
} catch (error) {
  console.error(`[jd-fetcher] Failed to fetch JD for ${job.company}: ${error}`);
  return null;
}
```

### Async/await over .then chains
```typescript
// ❌ Bad
fetchJD(url).then(text => process(text)).catch(err => log(err));

// ✅ Good
const text = await fetchJD(url);
```

### Constants in UPPER_SNAKE_CASE
```typescript
const MAX_RETRIES = 3;
const SHEET_HEADER_ROW = 1;
const GEMINI_MODEL = 'gemini-1.5-flash';
```

### Env variables accessed only through a config object
```typescript
// src/utils/config.ts
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  geminiKey: process.env.GEMINI_API_KEY!,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN!,
  sheetId: process.env.GOOGLE_SHEET_ID!,
  credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH!,
  chatId: process.env.YOUR_TELEGRAM_CHAT_ID!,
};
```
Never access `process.env.X` directly inside modules — always import from `config`.

---

## 2. File & Folder Naming

| Type | Convention | Example |
|---|---|---|
| Source files | kebab-case | `jd-fetcher.ts`, `sheet-writer.ts` |
| TypeScript types | PascalCase | `JobEntry`, `Contact` |
| Functions | camelCase | `scrapeListings()`, `fetchJD()` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `SHEET_ID` |
| Environment vars | UPPER_SNAKE | `GEMINI_API_KEY` |
| Folders | kebab-case | `src/modules/`, `src/bot/` |

---

## 3. Git Commit Message Format

Use the **Conventional Commits** standard. Every commit message follows this pattern:

```
<type>(<scope>): <short description>
```

### Types

| Type | When to use |
|---|---|
| `feat` | Adding a new feature or module |
| `fix` | Fixing a bug |
| `chore` | Setup, config, tooling (no logic change) |
| `refactor` | Restructuring code without changing behavior |
| `docs` | Adding or editing documentation |
| `test` | Adding test files |
| `style` | Formatting, whitespace (no logic change) |

### Scopes (for this project)

`scraper`, `jd-fetcher`, `ai`, `people`, `sheets`, `bot`, `types`, `config`, `docs`

### Examples

```bash
# ✅ Good commits
git commit -m "feat(scraper): add LinkedIn job listing scraper with Playwright"
git commit -m "feat(ai): integrate Gemini API for resume tailoring"
git commit -m "fix(jd-fetcher): handle LinkedIn 'See more' expand button"
git commit -m "chore(config): add dotenv setup and config.ts"
git commit -m "feat(sheets): add Google Sheets row writer with header init"
git commit -m "feat(bot): add Telegram /find command trigger"
git commit -m "docs: add README and project scope documentation"
git commit -m "refactor(ai): split resume tailoring and cold email into separate prompts"
git commit -m "fix(people): handle empty LinkedIn search results gracefully"

# ❌ Bad commits — never do these
git commit -m "fix stuff"
git commit -m "update"
git commit -m "wip"
git commit -m "changes"
git commit -m "asdfgh"
```

### Commit size rule
**One logical change per commit.** Don't dump everything into one giant commit.
If you built the scraper today, commit it. Don't wait until the whole project is done.

---

## 4. Branch Naming & Strategy

### Branch naming format

```
<type>/<short-description>
```

### Examples

```bash
# Feature branches
git checkout -b feat/job-scraper
git checkout -b feat/jd-fetcher
git checkout -b feat/gemini-integration
git checkout -b feat/people-finder
git checkout -b feat/google-sheets-writer
git checkout -b feat/telegram-bot

# Fix branches
git checkout -b fix/linkedin-block-handling
git checkout -b fix/gemini-rate-limit

# Docs branches
git checkout -b docs/readme-and-scope

# Chore branches
git checkout -b chore/project-setup
```

### Branch strategy for this project

Since this is a solo project, use a simple two-branch strategy:

```
main          ← stable, working code only
  └── feat/*  ← your active development branches
  └── fix/*   ← bug fix branches
  └── docs/*  ← documentation branches
```

**Never commit directly to `main`.** Always work on a feature branch and merge when it's working.

```bash
# Workflow for each phase
git checkout -b feat/job-scraper     # create branch
# ... write code ...
git add .
git commit -m "feat(scraper): add LinkedIn job scraper with Playwright"
git checkout main
git merge feat/job-scraper           # merge when module is working
git branch -d feat/job-scraper       # delete after merge
```

---

## 5. .env and Secrets Rules

```bash
# These files are NEVER committed to Git
.env
data/credentials.json
logs/

# Always in .gitignore — verify before every push
```

If you accidentally commit a secret:
1. Remove it from the file
2. `git rm --cached .env` (or the file)
3. Rotate the key immediately (generate a new one)
4. Add the file to `.gitignore`
5. Force push if needed: `git push --force`

---

## 6. Logging Pattern

All module logs follow this format so you can trace issues easily:

```typescript
// Pattern: [module-name] message
console.log('[scraper] Starting search for: "Next.js intern Bangalore"');
console.log('[scraper] Found 14 job listings');
console.error('[jd-fetcher] Failed to load URL: https://... | Error: timeout');
console.log('[ai] Processing job 3/14: Razorpay — SDE Intern');
console.log('[sheets] Row 4 written successfully');
```

---

## 7. Development Checklist (per module)

Before marking a module as "done", verify:

```
□ Function signatures are fully typed (no `any`)
□ All functions have try/catch with descriptive error messages
□ Module logs its start and completion with [module-name] prefix
□ Module is exported properly from its file
□ Module tested standalone before wiring into the pipeline
□ Committed with a proper conventional commit message
□ Merged into main only when working end-to-end
```