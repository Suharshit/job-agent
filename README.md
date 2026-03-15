# 🤖 Job Agent — Personal AI-Powered Job Hunt Automation

> A free, locally-run personal automation tool that scrapes jobs matching your profile, tailors your resume to each JD, finds relevant contacts at target companies, and drafts cold outreach messages — all dumped into a Google Sheet ready for you to act on.

---

## 🎯 What It Does

1. **Scrapes job listings** from LinkedIn based on your search query
2. **Fetches full job descriptions** from each listing URL
3. **Uses Google Gemini AI** to tailor your resume bullet points to each JD and score your match
4. **Finds 4–5 people** at each company (engineers, recruiters, hiring managers)
5. **Drafts cold outreach messages** personalized per contact
6. **Writes everything to a Google Sheet** — one row per job, ready to act on
7. **Triggered from your phone** via a Telegram bot

---

## 🏗️ Architecture

```
Your Phone (Telegram)
        ↓
  /find "Next.js intern remote India"
        ↓
┌────────────────────────────────┐
│        Node.js Server          │
│                                │
│  scraper.ts     → Job list     │
│  jd-fetcher.ts  → Full JD text │
│  ai-processor.ts→ Gemini AI    │
│  people-finder.ts→ Contacts    │
│  sheet-writer.ts→ Google Sheet │
└────────────────────────────────┘
        ↓
📊 Google Sheet link sent back to Telegram
```

---

## 🛠️ Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Language | Node.js + TypeScript | Free |
| Job Scraping | Playwright (LinkedIn) | Free |
| AI Processing | Google Gemini 1.5 Flash API | Free (1500 req/day) |
| People Finding | Playwright (LinkedIn) | Free |
| Spreadsheet Output | Google Sheets API | Free |
| Remote Trigger | Telegram Bot (grammy) | Free |
| Hosting | Your local machine | Free |

**Total running cost: ₹0**

---

## 📁 Project Structure

```
job-agent/
├── src/
│   ├── modules/
│   │   ├── scraper.ts          # Job listing scraper
│   │   ├── jd-fetcher.ts       # Full JD text fetcher
│   │   ├── ai-processor.ts     # Gemini: resume tailoring + cold emails
│   │   ├── people-finder.ts    # LinkedIn contact finder
│   │   └── sheet-writer.ts     # Google Sheets writer
│   ├── bot/
│   │   └── telegram.ts         # Telegram bot trigger
│   ├── types/
│   │   └── index.ts            # Shared TypeScript interfaces
│   ├── utils/
│   │   └── helpers.ts          # Utility functions
│   └── index.ts                # Main entry point
├── data/
│   ├── resume.txt              # Your resume in plain text
│   └── credentials.json        # Google service account (never commit)
├── logs/                       # Run logs
├── .env                        # Environment variables (never commit)
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## ⚙️ Setup

### Prerequisites
- Node.js v18+
- A Google account
- A Telegram account

### 1. Clone and install
```bash
git clone https://github.com/Suharshit/job-agent.git
cd job-agent
npm install
npx playwright install chromium
```

### 2. Set up credentials
See [project-scope.md](./docs/project-scope.md) for step-by-step credential setup instructions.

### 3. Configure environment
```bash
cp .env.example .env
# Fill in your values in .env
```

### 4. Add your resume
Edit `data/resume.txt` with your current resume content.

### 5. Run
```bash
# Test setup
npx ts-node src/test.ts

# Run manually
npx ts-node src/index.ts "Next.js intern Bangalore"

# Or trigger from Telegram
npx ts-node src/bot/telegram.ts
```

---

## 📊 Output Sheet Format

Each row in your Google Sheet contains:

| Column | Content |
|---|---|
| Company | Target company name |
| Role | Job title |
| Location | Remote / City |
| JD URL | Direct link to job posting |
| Match Score | AI-rated fit 0–100% |
| Tailored Bullets | 5 resume bullets rewritten for this JD |
| Contact 1–5 | Name, Title, LinkedIn, Email (if findable) |
| Cold Message | Personalized outreach draft per contact |
| Status | pending → applied → followed_up |
| Scraped At | Date of discovery |

---

## 🔐 Security Notes

- **Never commit** `.env` or `data/credentials.json` to Git
- This tool is for **personal use only** — scraping responsibly means adding delays and not hammering servers
- Your Google Sheet is private to your account

---

## 📄 Docs

- [Project Scope](./docs/project-scope.md)
- [Project Workflow](./docs/project-workflow.md)
- [Code & Git Patterns](./docs/pattern.md)

---

## 👤 Author

**Suharshit Singh** — [github.com/Suharshit](https://github.com/Suharshit) | [linkedin.com/in/suharshit-singh0905](https://linkedin.com/in/suharshit-singh0905)