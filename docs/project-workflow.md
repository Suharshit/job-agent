# 🔄 Project Workflow — Job Agent

## Full Pipeline (End to End)

```
┌─────────────────────────────────────────────────────┐
│  TRIGGER                                            │
│  You send: /find "Next.js intern Bangalore"         │
│  via Telegram on your phone                         │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  MODULE 1: JOB SCRAPER (scraper.ts)                 │
│                                                     │
│  Input:  Search query string                        │
│  Action: Open LinkedIn Jobs via Playwright          │
│          Search with query                          │
│          Collect 10–15 job listing cards            │
│  Output: JobListing[] = { title, company,           │
│          location, jd_url }                         │
└────────────────────┬────────────────────────────────┘
                     ↓ (for each job)
┌─────────────────────────────────────────────────────┐
│  MODULE 2: JD FETCHER (jd-fetcher.ts)               │
│                                                     │
│  Input:  jd_url from Module 1                       │
│  Action: Open each job URL via Playwright           │
│          Extract full job description text          │
│          Clean and normalize the text               │
│  Output: jd_text (string, full JD content)          │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  MODULE 3: AI PROCESSOR (ai-processor.ts)           │
│                                                     │
│  Input:  resume.txt + jd_text                       │
│  Action: Call Gemini 1.5 Flash API                  │
│                                                     │
│  Prompt 1 → Match Score (0–100)                     │
│  Prompt 2 → 5 tailored resume bullets               │
│  Prompt 3 → Cold outreach message draft             │
│                                                     │
│  Output: { match_score, tailored_bullets[],         │
│            cold_message }                           │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  MODULE 4: PEOPLE FINDER (people-finder.ts)         │
│                                                     │
│  Input:  Company name                               │
│  Action: Search LinkedIn for people at company      │
│          Filter by: Software Engineer, SDE,         │
│          Engineering Manager, Recruiter, HR         │
│          Collect top 4–5 profiles                   │
│          Guess email pattern if not visible         │
│  Output: Contact[] = { name, title,                 │
│          linkedin_url, email }                      │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  MODULE 5: SHEET WRITER (sheet-writer.ts)           │
│                                                     │
│  Input:  Complete JobEntry object                   │
│  Action: Authenticate with Google Sheets API        │
│          Append one new row to the sheet            │
│          Format cells (colors, links, wrapping)     │
│  Output: Row added to Google Sheet ✅               │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  MODULE 6: TELEGRAM BOT (telegram.ts)               │
│                                                     │
│  Action: Send notification back to your phone       │
│          Message: "✅ Done! 12 jobs added."         │
│          + Direct link to your Google Sheet         │
└─────────────────────────────────────────────────────┘
```

---

## Module Responsibilities

### scraper.ts
- Opens LinkedIn Jobs in a headless Chromium browser
- Types the search query
- Scrolls to load more results
- Extracts: job title, company name, location, JD URL
- Adds 2–4 second random delays between actions
- Returns array of raw job listings

### jd-fetcher.ts
- Accepts a JD URL
- Opens it in Playwright
- Waits for the full description to load
- Extracts and returns the full text
- Handles LinkedIn's "See more" expand button

### ai-processor.ts
- Reads `data/resume.txt` once at startup
- For each job: sends 3 separate prompts to Gemini
  - Prompt 1: "Score how well this resume fits this JD (0–100). Return only a number."
  - Prompt 2: "Rewrite these 5 resume bullet points to be more relevant to this JD."
  - Prompt 3: "Draft a 3-sentence cold LinkedIn/email message for a student applying to this role."
- Rate limits itself to avoid hitting Gemini's free tier limits

### people-finder.ts
- Searches LinkedIn for `"software engineer" at "CompanyName"`
- Collects profile names, titles, LinkedIn URLs
- Attempts to find or guess email addresses
- Returns top 4–5 most relevant contacts

### sheet-writer.ts
- Authenticates using the service account credentials JSON
- Ensures the header row exists on first run
- Appends one row per job with all data
- Applies basic formatting: freeze top row, set column widths

### telegram.ts
- Listens for messages from your Telegram chat ID only (security)
- Parses `/find <query>` commands
- Calls the main pipeline
- Sends progress updates ("Scraping jobs...", "Running AI...", "Writing sheet...")
- Sends final sheet link when done

---

## Error Handling Strategy

| Error | Handling |
|---|---|
| LinkedIn blocks scraper | Retry with longer delay; skip job if 3 retries fail |
| JD page not loading | Skip job, log URL for manual review |
| Gemini rate limit hit | Wait 60s, retry automatically |
| Google Sheets auth fails | Send error message to Telegram |
| No contacts found | Leave contacts columns blank, continue |
| General crash | Log full error to `logs/` folder, notify Telegram |

---

## Timing Estimates

| Step | Time per Job | 15 Jobs Total |
|---|---|---|
| Job scraping | ~3s | ~45s |
| JD fetching | ~5s | ~75s |
| Gemini AI (3 prompts) | ~8s | ~120s |
| People finding | ~10s | ~150s |
| Sheet writing | ~1s | ~15s |
| **Total** | **~27s/job** | **~7 minutes** |

---

## Data Flow Diagram

```
resume.txt ──────────────────────────────────────┐
                                                 ↓
query ──→ scraper ──→ jd-fetcher ──→ ai-processor ──→ sheet-writer ──→ Google Sheet
                          ↑                              ↑
                     people-finder ────────────────────┘
                          ↑
                    company name (from scraper)
```

---

## Development vs Production Mode

```typescript
// In .env
NODE_ENV=development   // Scrapes only 3 jobs, skips sheet write, logs to console
NODE_ENV=production    // Full run, writes to sheet, notifies Telegram
```

This way you can test individual modules without burning through Gemini quota or polluting your sheet.