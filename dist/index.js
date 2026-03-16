"use strict";
// src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPipeline = runPipeline;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uuid_1 = require("uuid");
const helpers_1 = require("./utils/helpers");
const config_1 = require("./utils/config");
const scraper_1 = require("./modules/scraper");
const jd_fetcher_1 = require("./modules/jd-fetcher");
const ai_processor_1 = require("./modules/ai-processor");
const sheet_writer_1 = require("./modules/sheet-writer");
const MAX_JOBS = config_1.config.isDev ? 2 : config_1.config.maxJobs;
const noOp = async () => { };
async function runPipeline(query, onProgress = noOp) {
    (0, helpers_1.log)('pipeline', `🚀 Starting job hunt for: "${query}"`);
    const result = {
        success: false,
        jobs_processed: 0,
        sheet_url: config_1.config.sheetUrl,
        errors: [],
    };
    try {
        // Step 1
        await onProgress('Step 1/4 — Scraping LinkedIn job listings...');
        (0, helpers_1.log)('pipeline', 'Step 1/4 — Scraping job listings...');
        const listings = await (0, scraper_1.scrapeJobs)(query);
        const limited = listings.slice(0, MAX_JOBS);
        (0, helpers_1.log)('pipeline', `Working with ${limited.length} jobs`);
        if (limited.length === 0) {
            result.errors.push('No jobs found for this query');
            return result;
        }
        // Step 2
        await onProgress(`Step 2/4 — Fetching ${limited.length} job descriptions...`);
        (0, helpers_1.log)('pipeline', 'Step 2/4 — Fetching job descriptions...');
        const withJDs = await (0, jd_fetcher_1.fetchAllJDs)(limited);
        // Step 3
        await onProgress('Step 3/4 — Setting up Google Sheet...');
        (0, helpers_1.log)('pipeline', 'Step 3/4 — Setting up Google Sheet...');
        await (0, sheet_writer_1.initSheet)();
        // Step 4
        await onProgress(`Step 4/4 — AI processing ${withJDs.length} jobs...`);
        (0, helpers_1.log)('pipeline', 'Step 4/4 — AI processing and writing to sheet...');
        for (let i = 0; i < withJDs.length; i++) {
            const job = withJDs[i];
            (0, helpers_1.log)('pipeline', `Processing job ${i + 1}/${withJDs.length}: ${job.company}`);
            await onProgress(`🤖 Processing ${i + 1}/${withJDs.length}: ${job.company} — ${job.title}`);
            try {
                const aiResult = await (0, ai_processor_1.processJob)(job.company, job.title, job.jd_text);
                const entry = {
                    job_id: (0, uuid_1.v4)(),
                    scraped_at: new Date().toISOString().split('T')[0],
                    company: job.company,
                    role: job.title,
                    location: job.location,
                    jd_url: job.jd_url,
                    jd_text: job.jd_text,
                    match_score: aiResult.match_score,
                    tailored_bullets: aiResult.tailored_bullets,
                    contacts: aiResult.contacts,
                    cold_message: aiResult.cold_message,
                    status: 'pending',
                };
                await (0, sheet_writer_1.writeJobToSheet)(entry);
                result.jobs_processed++;
                await (0, helpers_1.randomDelay)(1000, 2000);
            }
            catch (jobError) {
                (0, helpers_1.logError)('pipeline', `Failed on job: ${job.company}`, jobError);
                result.errors.push(`${job.company}: ${jobError}`);
            }
        }
        result.success = true;
        (0, helpers_1.log)('pipeline', `✅ Done! ${result.jobs_processed} jobs written to sheet`);
    }
    catch (error) {
        (0, helpers_1.logError)('pipeline', 'Pipeline failed', error);
        result.errors.push(String(error));
    }
    return result;
}
// Run directly from command line
const query = process.argv[2];
if (query) {
    runPipeline(query).then(result => {
        console.log('\n📊 Result:', JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
    });
}
