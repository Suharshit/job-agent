// src/types/index.ts

export interface JobListing {
  title: string;
  company: string;
  location: string;
  jd_url: string;
}

export interface Contact {
  name: string;
  title: string;
  linkedin_url: string;
  email: string | null;
}

export type JobStatus = 'pending' | 'applied' | 'followed_up' | 'rejected';

export interface JobEntry {
  job_id: string;
  scraped_at: string;
  company: string;
  role: string;
  location: string;
  jd_url: string;
  jd_text: string;
  match_score: number;
  tailored_bullets: string[];
  contacts: Contact[];
  cold_message: string;
  status: JobStatus;
}

export interface AIProcessorResult {
  match_score: number;
  tailored_bullets: string[];
  cold_message: string;
  contacts: Contact[];  // ✅ add this
}

export interface PipelineResult {
  success: boolean;
  jobs_processed: number;
  sheet_url: string;
  errors: string[];
}