"use strict";
// src/modules/ai-processor.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processJob = processJob;
const genai_1 = require("@google/genai");
const config_1 = require("../utils/config");
const helpers_1 = require("../utils/helpers");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ai = new genai_1.GoogleGenAI({ apiKey: config_1.config.geminiKey });
// At the top of ai-processor.ts, after imports
const GEMINI_MODEL = 'gemini-2.5-flash';
// Load resume once at startup
const resumePath = path.join(process.cwd(), 'data', 'resume.txt');
const RESUME_TEXT = fs.readFileSync(resumePath, 'utf-8');
async function callGemini(prompt, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: prompt,
            });
            return response.text?.trim() ?? '';
        }
        catch (error) {
            if (attempt === retries)
                throw error;
            if (error?.status === 429) {
                const match = String(error?.message).match(/retryDelay":"(\d+)s"/);
                const waitSeconds = match ? Math.min(parseInt(match[1]) + 5, 120) : 30;
                (0, helpers_1.log)('ai', `Rate limited — waiting ${waitSeconds}s (attempt ${attempt}/${retries})`);
                await (0, helpers_1.sleep)(waitSeconds * 1000);
            }
            else {
                await (0, helpers_1.sleep)(5000);
            }
        }
    }
    return '';
}
async function processJob(company, role, jd_text) {
    (0, helpers_1.log)('ai', `Processing: ${company} — ${role}`);
    try {
        // Prompt 1: Match Score
        const scorePrompt = `
You are a technical recruiter. Score how well this resume matches the job description.
Return ONLY a number between 0 and 100. Nothing else — no explanation, no text, just the number.

RESUME:
${RESUME_TEXT}

JOB DESCRIPTION:
${jd_text.substring(0, 3000)}
`.trim();
        const scoreRaw = await callGemini(scorePrompt);
        const match_score = Math.min(100, Math.max(0, parseInt(scoreRaw) || 50));
        (0, helpers_1.log)('ai', `Match score: ${match_score}%`);
        await (0, helpers_1.sleep)(1000);
        // Prompt 2: Tailored Bullets
        const bulletsPrompt = `
You are a resume expert. Rewrite exactly 5 resume bullet points from the candidate's resume
to better match the job description. Keep them truthful — only rephrase and reorder emphasis.
Return ONLY the 5 bullet points, one per line, each starting with "- ".
No preamble, no explanation, no numbering.

RESUME:
${RESUME_TEXT}

JOB DESCRIPTION:
${jd_text.substring(0, 3000)}
`.trim();
        const bulletsRaw = await callGemini(bulletsPrompt);
        const tailored_bullets = bulletsRaw
            .split('\n')
            .map(b => b.trim())
            .filter(b => b.startsWith('- '))
            .map(b => b.slice(2).trim())
            .slice(0, 5);
        (0, helpers_1.log)('ai', `Generated ${tailored_bullets.length} tailored bullets`);
        await (0, helpers_1.sleep)(1000);
        // Prompt 3: Cold Message
        const coldPrompt = `
Write a short, personalized cold LinkedIn message (max 4 sentences) from a student
to someone working at the company. The student is applying for the role listed.
Be genuine, specific to the company, and end with a soft ask for a referral or chat.
Return ONLY the message text. No subject line, no explanation.

Student: Full-stack engineer, 3rd year CSE student at LPU, skilled in Next.js, TypeScript, Node.js, Supabase
Company: ${company}
Role: ${role}
`.trim();
        const cold_message = await callGemini(coldPrompt);
        (0, helpers_1.log)('ai', `Cold message drafted (${cold_message.length} chars)`);
        // Prompt 4: People to reach out to + cold messages per role
        const peoplePrompt = `
    You are a job search coach helping a student get referrals for an internship.

    For the company "${company}" and role "${role}", suggest exactly 5 types of people 
    the student should reach out to on LinkedIn for a referral or informational chat.

    For each person, provide:
    1. Their likely job title to search on LinkedIn
    2. A personalized 3-sentence cold LinkedIn message addressed to that type of person

    Format your response EXACTLY like this, with no extra text:
    TITLE: [job title to search]
    MESSAGE: [cold message]
    ---
    TITLE: [job title to search]
    MESSAGE: [cold message]
    ---
    (repeat 5 times)

    Student background: Full-stack engineer, 3rd year CSE student at LPU, skilled in Next.js, TypeScript, Node.js, Supabase, PostgreSQL
    Target company: ${company}
    Role: ${role}
    `.trim();
        const peopleRaw = await callGemini(peoplePrompt);
        await (0, helpers_1.sleep)(5000);
        // Parse the people suggestions
        const peopleSuggestions = peopleRaw
            .split('---')
            .map(block => block.trim())
            .filter(block => block.includes('TITLE:') && block.includes('MESSAGE:'))
            .slice(0, 5)
            .map(block => {
            const titleMatch = block.match(/TITLE:\s*(.+)/);
            const messageMatch = block.match(/MESSAGE:\s*([\s\S]+?)(?=TITLE:|$)/);
            return {
                name: '',
                title: titleMatch?.[1]?.trim() ?? '',
                linkedin_url: '',
                email: messageMatch?.[1]?.trim() ?? null,
            };
        });
        (0, helpers_1.log)('ai', `Generated ${peopleSuggestions.length} people suggestions`);
        return {
            match_score,
            tailored_bullets,
            cold_message,
            contacts: peopleSuggestions // ✅ add this
        };
    }
    catch (error) {
        (0, helpers_1.logError)('ai', `Failed to process ${company} — ${role}`, error);
        return { match_score: 0, tailored_bullets: [], cold_message: '', contacts: [] };
    }
}
