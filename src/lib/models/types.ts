export interface ChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

export interface LLMResponse {
  readonly text: string;
  readonly model: string;
  readonly tokensUsed?: number;
  readonly latencyMs: number;
}

export interface LLMClient {
  chat(messages: readonly ChatMessage[]): Promise<LLMResponse>;
}
