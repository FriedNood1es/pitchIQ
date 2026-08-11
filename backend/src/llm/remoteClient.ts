import { LLMClient } from "./llmClient";
import { LLM_BASE_URLS, LLM_DEFAULT_MODELS, config } from "../config";

const LLM_TIMEOUT_MS = 10_000;

/**
 * Real LLM client over an OpenAI-compatible chat-completions endpoint (Groq,
 * Gemini, OpenRouter). Uses global fetch so no dependency is needed.
 * Free tiers are rate-limited, so the call carries a 10s abort timeout
 * (mirroring the BSD 8s pattern) — a stalled or exhausted provider must never
 * hang a comparison; callers fall back to the deterministic template.
 */
export class RemoteLLMClient implements LLMClient {
  readonly kind = "ai" as const;
  private readonly baseUrl = LLM_BASE_URLS[config.llm.provider];
  private readonly model = config.llm.model || LLM_DEFAULT_MODELS[config.llm.provider];
  private readonly apiKey = config.llm.apiKey;

  async generateInsight(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a football analyst writing match insight for a team comparison app. " +
              "Use only the supplied data; never invent stats. Write 3-4 sentences, no markdown, no preamble.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 350,
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`LLM request failed (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("LLM returned an empty response");
    return content;
  }
}
