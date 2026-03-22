import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@/lib/config/env";
import type { ChatMessage, LLMClient, LLMResponse } from "./types";

export class ClaudeClient implements LLMClient {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor() {
    const env = getEnv();
    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
    this.model = env.CLAUDE_MODEL;
  }

  async chat(messages: readonly ChatMessage[]): Promise<LLMResponse> {
    const start = Date.now();

    // Separate system message from conversation messages
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      ...(systemMessage ? { system: systemMessage.content } : {}),
      messages: conversationMessages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    return {
      text,
      model: this.model,
      tokensUsed,
      latencyMs: Date.now() - start,
    };
  }
}
