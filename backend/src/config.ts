try { process.loadEnvFile(); } catch { /* .env absent in production — env vars come from Render */ }

/**
 * Central runtime config, sourced from environment variables (.env in dev).
 *
 * BSD (sports.bzzoiro.com) is the sole data provider: no rate limit and it
 * exposes current-season standings with expected-goals (xG) data. Seasons are
 * pinned per competition in `data/competitions.ts`, so no league/season env
 * is needed here.
 */
export const LLM_BASE_URLS = {
  groq: "https://api.groq.com/openai/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
} as const;

export type LlmProvider = keyof typeof LLM_BASE_URLS;

export const config = {
  bsd: {
    key: process.env.BSD_KEY ?? "",
    baseUrl: "https://sports.bzzoiro.com/api",
  },

  llm: {
    provider: (process.env.LLM_PROVIDER as LlmProvider) ?? "groq",
    apiKey: process.env.LLM_API_KEY ?? "",
    // The old groq default (llama-3.3-70b-versatile) was retired.
    model: process.env.LLM_MODEL ?? "openai/gpt-oss-20b",
  },
};
