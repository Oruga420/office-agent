import type { ModelChoice } from "@/lib/router/types";
import { ClaudeClient } from "./claude";
import { NemotronClient } from "./nemotron";
import type { ChatMessage, LLMClient, LLMResponse } from "./types";

let nemotronClient: NemotronClient | null = null;
let claudeClient: ClaudeClient | null = null;

function getModelClient(model: ModelChoice): LLMClient {
  if (model === "nemotron") {
    if (!nemotronClient) {
      nemotronClient = new NemotronClient();
    }
    return nemotronClient;
  }

  if (!claudeClient) {
    claudeClient = new ClaudeClient();
  }
  return claudeClient;
}

export async function chat(
  model: ModelChoice,
  messages: readonly ChatMessage[],
): Promise<LLMResponse> {
  const client = getModelClient(model);
  return client.chat(messages);
}

export type { ChatMessage, LLMResponse } from "./types";
