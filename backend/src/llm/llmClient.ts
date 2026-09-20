import { config } from "../config";
import { RemoteLLMClient } from "./remoteClient";

export interface LLMClient {
  generateInsight(prompt: string): Promise<string>;
  /** "ai" for a real model, "template" for the deterministic echo mock. */
  readonly kind: "ai" | "template";
}

/** Real client when LLM_API_KEY is set, else the echo mock (template). */
export function createLLM(): LLMClient {
  if (config.llm.apiKey) return new RemoteLLMClient();
  // Deterministic stand-in: echoes the templated prose built by insightAgent.
  return { kind: "template", generateInsight: async (prompt: string) => prompt };
}
