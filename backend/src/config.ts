import "dotenv/config";

/**
 * Central runtime config, sourced from environment variables (.env in dev).
 *
 * BSD (sports.bzzoiro.com) is the sole data provider: no rate limit and it
 * exposes current-season standings with expected-goals (xG) data. BSD_SEASON
 * defaults to 337 (Premier League 25/26), the most recent completed season —
 * the live 26/27 season has no table yet.
 */
export type LlmProvider = "groq" | "gemini" | "openrouter";

/** OpenAI-compatible base URL per provider; only the endpoint differs. */
export const LLM_BASE_URLS: Record<LlmProvider, string> = {
  groq: "https://api.groq.com/openai/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
};

export const LLM_DEFAULT_MODELS: Record<LlmProvider, string> = {
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.5-flash",
  openrouter: "meta-llama/llama-3.3-70b-instruct",
};

export const config = {
  bsd: {
    key: process.env.BSD_KEY ?? "",
    baseUrl: "https://sports.bzzoiro.com/api",
    league: Number(process.env.BSD_LEAGUE ?? 1),
    season: Number(process.env.BSD_SEASON ?? 337),
  },

  useMockData: process.env.USE_MOCK_DATA === "true",

  llm: {
    provider: (process.env.LLM_PROVIDER as LlmProvider) ?? "groq",
    apiKey: process.env.LLM_API_KEY ?? "",
    model: process.env.LLM_MODEL ?? "",
  },
};
