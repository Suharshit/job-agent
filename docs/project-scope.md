# 📐 Project Scope — Job Agent

## Problem Statement

Job hunting as a student is time-consuming and repetitive. Every application needs:
- A tailored resume
- Research into who works at the company
- A personalized cold outreach message
- Tracking across dozens of applications

This tool automates the research and drafting so you focus only on the actions that require human judgment: editing, applying, and reaching out.

---

## Goals

### In Scope ✅

- Scrape job listings from LinkedIn matching a search query
- Fetch the full job description text from each listing
- Use Gemini AI to score resume–JD fit (0–100%)
- Use Gemini AI to rewrite 5 resume bullet points tailored to the JD
- Use Gemini AI to draft a cold outreach message per contact
- Find 4–5 relevant people at the company via LinkedIn
- Write all output to a Google Sheet (one row per job)
- Trigger the entire pipeline via a Telegram bot message from your phone
- Notify you via Telegram when the sheet is ready with a direct link

### Out of Scope ❌

- Automatically applying to jobs on your behalf
- Automatically sending emails or messages
- Running continuously in the background without a manual trigger
- Storing or processing other people's personal data beyond what's publicly visible
- Any paid API or service

---

## Target User

**You — Suharshit Singh** — a 3rd-year CSE student at LPU actively looking for internships and full-time roles in full-stack development.

Stack you target: Next.js, Node.js, TypeScript, Supabase, PostgreSQL, React

---

## Credentials Setup (Step-by-Step)

### 1. Gemini API Key (Google AI Studio)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google → click **"Get API Key"**
3. Click **"Create API key"** → copy it
4. Paste into `.env` as `GEMINI_API_KEY`

Free tier: **1,500 requests/day** — more than enough

### 2. Telegram Bot Token
1. Open Telegram → search `@BotFather`
2. Send `/newbot`
3. Name: `Job Hunter` | Username: `suharshit_jobhunter_bot`
4. Copy the token BotFather gives you
5. Paste into `.env` as `TELEGRAM_BOT_TOKEN`

To get your Chat ID:
1. Message your bot once after creating it
2. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find `"id"` inside `"chat"` — that's your chat ID
4. Paste into `.env` as `YOUR_TELEGRAM_CHAT_ID`

### 3. Google Sheets API
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → name it `job-agent`
3. **APIs & Services → Enable APIs → Google Sheets API** → Enable
4. **APIs & Services → Enable APIs → Google Drive API** → Enable
5. **Credentials → Create Credentials → Service Account**
   - Name: `job-agent-bot` → Create → Done
6. Click the service account → **Keys tab → Add Key → Create New Key → JSON**
   - Save the downloaded file as `data/credentials.json`
7. Go to [sheets.google.com](https://sheets.google.com) → create a new blank sheet
   - Name it `Job Hunt Tracker`
8. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)
   - Paste into `.env` as `GOOGLE_SHEET_ID`
9. Open `data/credentials.json` → copy the `client_email` value
10. In your Google Sheet → **Share** → paste that email → grant **Editor** access

---

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_CREDENTIALS_PATH=./data/credentials.json
YOUR_TELEGRAM_CHAT_ID=your_chat_id_here
```

---

## Data Model

```typescript
interface JobEntry {
  job_id: string;               // UUID
  scraped_at: string;           // ISO date string
  company: string;
  role: string;
  location: string;
  jd_url: string;
  jd_text: string;              // Full job description
  match_score: number;          // 0–100, AI-rated
  tailored_bullets: string[];   // 5 bullet points rewritten for this JD
  contacts: Contact[];          // 4–5 people at the company
  cold_message: string;         // AI-drafted outreach template
  status: 'pending' | 'applied' | 'followed_up' | 'rejected';
}

interface Contact {
  name: string;
  title: string;
  linkedin_url: string;
  email: string | null;         // Guessed pattern or found via scraping
}
```

---

## Constraints

| Constraint | Decision |
|---|---|
| Zero cost | All free APIs and local tools only |
| No auto-apply | Human reviews every application |
| No auto-send | Human sends every message |
| Personal use | Single user, no auth system needed |
| Local-first | Runs on your laptop, triggered remotely |
| LinkedIn scraping | Add 2–5s random delays to avoid blocks |

---

## Success Criteria

The project is "done" when:
1. You send `/find "Next.js intern remote India"` on Telegram from your phone
2. 3–5 minutes later you receive a Google Sheets link
3. The sheet has at least 5 jobs with: company, role, match score, tailored bullets, contacts, cold message drafts
4. All of this costs ₹0 to run