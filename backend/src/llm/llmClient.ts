import { config } from "../config";
import { RemoteLLMClient } from "./remoteClient";

export interface LLMClient {
  generateInsight(prompt: string): Promise<string>;
  /** "ai" for a real model, "template" for the deterministic echo mock. */
  readonly kind: "ai" | "template";
}

/**
 * Deterministic stand-in for a real LLM call: echoes the prompt back, which is
 * the templated prose built by insightAgent. Used when no LLM_API_KEY is set.
 */
export class MockLLMClient implements LLMClient {
  readonly kind = "template" as const;
  async generateInsight(prompt: string): Promise<string> {
    return prompt;
  }
}

/** Real client when LLM_API_KEY is set, else the echo mock (template). */
export function createLLM(): LLMClient {
  return config.llm.apiKey ? new RemoteLLMClient() : new MockLLMClient();
}
