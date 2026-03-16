# 🤖 Job Agent — AI-Powered Personal Job Hunt Automation

> Built by a college student, for college students. Scrapes jobs, tailors your resume with AI, suggests who to cold message, and dumps everything into a Google Sheet — triggered from your phone in one command.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Cost](https://img.shields.io/badge/running%20cost-%E2%82%B90%2Fmonth-success)
![Deployed](https://img.shields.io/badge/deployed-Railway-blueviolet)

---

## 🎯 The Problem

Every job application used to take me 2+ hours:
- Find relevant listings manually
- Read the full JD and figure out what to highlight
- Rewrite my resume bullets for that specific role
- Research who works at the company
- Write a cold message from scratch
- Track everything across tabs and notes

I automated all of it.

---

## ⚡ What It Does

Send one command from your phone. Get a filled Google Sheet in 5-7 minutes.

```
You → Telegram: /find full stack intern remote India
         ↓
   Scrapes LinkedIn for matching jobs
         ↓
   Fetches full job descriptions
         ↓
   Gemini AI scores your resume fit (0–100%)
         ↓
   Rewrites 5 resume bullets tailored to each JD
         ↓
   Suggests 5 types of people to cold message
         ↓
   Drafts personalized outreach per role type
         ↓
   Writes everything to Google Sheet
         ↓
You ← Telegram: "Done! 6 jobs added. Open your sheet: [link]"
```

---

## 📊 Output — Google Sheet Per Job

| Column | Content |
|---|---|
| Company + Role | Job details |
| JD URL | Direct link to apply |
| Match Score | AI-rated fit 0–100% |
| Bullet 1–5 | Resume bullets rewritten for this JD |
| Search Title 1–5 | Who to find on LinkedIn |
| Cold Message 1–5 | Personalized outreach per role type |
| General Cold Message | General application message |
| Status | pending → applied → followed\_up |

---

## 🛠️ Tech Stack

| Layer | Tool |
|---|---|
| Language | Node.js + TypeScript |
| Job Scraping | Playwright (LinkedIn) |
| JD Fetching | Playwright (headless Chromium) |
| AI Processing | Google Gemini 2.5 Flash API |
| Spreadsheet | Google Sheets API |
| Bot Trigger | Telegram Bot (Grammy) |
| Hosting | Railway |
| Alerts | Telegram notifications |

**Running cost: ₹0/month** — all free tiers.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              Railway Server (24/7)           │
│                                             │
│  Telegram Bot (Grammy)                      │
│       ↓ /find command                       │
│                                             │
│  scraper.ts      → Job listings             │
│  jd-fetcher.ts   → Full JD text             │
│  ai-processor.ts → Gemini AI                │
│       ↓ match score                         │
│       ↓ tailored bullets                    │
│       ↓ cold messages                       │
│  sheet-writer.ts → Google Sheet             │
│       ↓                                     │
│  Telegram notification → Your phone         │
└─────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
job-agent/
├── src/
│   ├── modules/
│   │   ├── scraper.ts          # LinkedIn job scraper
│   │   ├── jd-fetcher.ts       # Full JD text fetcher
│   │   ├── ai-processor.ts     # Gemini AI processing
│   │   ├── people-finder.ts    # Contact suggestions
│   │   └── sheet-writer.ts     # Google Sheets writer
│   ├── bot/
│   │   ├── telegram.ts         # Bot commands
│   │   └── start.ts            # Entry point
│   ├── types/
│   │   └── index.ts            # Shared TypeScript types
│   ├── utils/
│   │   ├── config.ts           # Environment config
│   │   ├── helpers.ts          # Utilities
│   │   ├── mailer.ts           # Telegram alerts
│   │   └── monitor.ts          # Health monitoring
│   └── index.ts                # Pipeline orchestrator
├── data/
│   └── resume.txt              # Your resume (plain text)
├── docs/
│   ├── project-scope.md
│   ├── project-workflow.md
│   └── pattern.md
├── railway.json
├── .env.example
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- A Google account
- A Telegram account
- A Railway account (free)

### 1. Clone the repo
```bash
git clone https://github.com/Suharshit/job-agent.git
cd job-agent
npm install
npx playwright install chromium
```

### 2. Get your free API credentials

| Service | Where | What you need |
|---|---|---|
| **Gemini API** | [aistudio.google.com](https://aistudio.google.com) | API Key |
| **Telegram Bot** | [@BotFather](https://t.me/BotFather) on Telegram | Bot Token + Chat ID |
| **Google Sheets** | [console.cloud.google.com](https://console.cloud.google.com) | Service Account JSON |

Full step-by-step credential setup in [docs/project-scope.md](./docs/project-scope.md)

### 3. Configure environment
```bash
cp .env.example .env
# Fill in your values
```

```env
GEMINI_API_KEY=your_gemini_key
TELEGRAM_BOT_TOKEN=your_bot_token
YOUR_TELEGRAM_CHAT_ID=your_chat_id
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_CREDENTIALS_PATH=./data/credentials.json
GOOGLE_SHEET_URL=your_sheet_url
```

### 4. Add your resume
Edit `data/resume.txt` with your resume in plain text format.

### 5. Run locally
```bash
# Start the bot
npx ts-node src/bot/start.ts

# Or run pipeline directly from terminal
npx ts-node src/index.ts "full stack intern India"
```

---

## ☁️ Deploy to Railway (Free)

### 1. Convert credentials to base64
```bash
node -e "console.log(Buffer.from(require('fs').readFileSync('./data/credentials.json')).toString('base64'))"
```

### 2. Build and push to GitHub
```bash
npm run build
git add .
git push origin main
```

### 3. Deploy on Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your `job-agent` repo
3. Add all environment variables from `.env` plus:
   ```
   GOOGLE_CREDENTIALS_BASE64=your_base64_string
   NODE_ENV=production
   ```
4. Deploy — bot runs 24/7, no laptop needed

---

## 📱 Bot Commands

| Command | Description |
|---|---|
| `/find <query>` | Start a full job hunt pipeline |
| `/start` | Show welcome message |
| `/help` | Show all commands |
| `/testmail` | Test Telegram alerts |

**Example queries:**
```
/find full stack intern remote India
/find Next.js developer intern Bangalore
/find SDE intern 2026 India
```

---

## 💡 Daily Workflow

```
1. Open Telegram → /find full stack intern India
2. Wait 5-7 minutes
3. Open Google Sheet link sent by bot
4. Sort by Match Score (highest first)
5. Pick top 3 jobs
6. Copy tailored bullets → update resume for that JD
7. Search suggested titles on LinkedIn → find real people
8. Copy cold message → personalize name → send
9. Apply to the job
10. Update status to "applied" in sheet
```

Total active time per job: ~5 minutes instead of 2 hours.

---

## 🔧 Development

```bash
# Dev mode (2 jobs, verbose logging)
npx ts-node src/bot/start.ts

# Build TypeScript
npm run build

# Run compiled version
npm start
```

See [docs/pattern.md](./docs/pattern.md) for code conventions and git commit standards.

---

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key (free) |
| `TELEGRAM_BOT_TOKEN` | From @BotFather on Telegram |
| `YOUR_TELEGRAM_CHAT_ID` | Your personal Telegram chat ID |
| `GOOGLE_SHEET_ID` | Sheet ID from the URL |
| `GOOGLE_CREDENTIALS_PATH` | Local path to service account JSON |
| `GOOGLE_CREDENTIALS_BASE64` | Base64 credentials for Railway |
| `GOOGLE_SHEET_URL` | Full sheet URL sent in bot messages |

---

## 📈 Roadmap

- [x] LinkedIn job scraping with Playwright
- [x] AI resume tailoring with Gemini 2.5 Flash
- [x] Per-role cold message generation
- [x] Google Sheets output with all data
- [x] Telegram bot trigger from phone
- [x] Railway deployment (24/7, free)
- [x] Health monitoring + Telegram alerts
- [ ] `/status` — weekly application stats
- [ ] Recent jobs filter (last 7 days only)
- [ ] Multi-platform support (Naukri, Wellfound)
- [ ] Follow-up reminder system

---

## ⚠️ Disclaimer

This tool is for personal, non-commercial use only. Use responsibly with appropriate request delays. The author is not responsible for any account restrictions resulting from misuse. Always respect platform terms of service.

---

## 👤 Author

**Suharshit Singh**
3rd Year CSE Student at Lovely Professional University

[GitHub](https://github.com/Suharshit) · [LinkedIn](https://linkedin.com/in/suharshit-singh0905)

---

## 📄 License

MIT — free to use, modify, and distribute.