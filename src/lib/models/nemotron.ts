import OpenAI from "openai";
import { getEnv } from "@/lib/config/env";
import type { ChatMessage, LLMClient, LLMResponse } from "./types";

export class NemotronClient implements LLMClient {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    const env = getEnv();
    this.client = new OpenAI({
      baseURL: env.NVIDIA_BASE_URL,
      apiKey: env.NVIDIA_API_KEY,
    });
    this.model = env.NVIDIA_MODEL;
  }

  async chat(messages: readonly ChatMessage[]): Promise<LLMResponse> {
    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.3,
      max_tokens: 2048,
    });

    const choice = response.choices[0];
    const text = choice?.message?.content ?? "";
    const tokensUsed = response.usage
      ? response.usage.prompt_tokens + response.usage.completion_tokens
      : undefined;

    return {
      text,
      model: this.model,
      tokensUsed,
      latencyMs: Date.now() - start,
    };
  }
}
