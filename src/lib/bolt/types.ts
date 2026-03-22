import type { SlackAction } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";

/** Thread context with message history for the AI */
export interface ThreadContext {
  readonly messages: readonly ThreadMessage[];
  readonly depth: number;
}

/** A single message from Slack thread history */
export interface ThreadMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}
