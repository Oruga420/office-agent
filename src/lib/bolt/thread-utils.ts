import type { WebClient } from "@slack/web-api";
import type { ThreadContext, ThreadMessage } from "./types";

/**
 * Fetches thread history from Slack and converts it into a context
 * object suitable for passing to the AI model.
 */
export async function getThreadContext(
  client: WebClient,
  channel: string,
  threadTs: string,
  botUserId: string,
): Promise<ThreadContext> {
  const result = await client.conversations.replies({
    channel,
    ts: threadTs,
    limit: 10,
  });

  const slackMessages = result.messages ?? [];

  const messages: ThreadMessage[] = slackMessages
    .filter((msg) => msg.text && msg.ts !== threadTs)
    .map((msg) => ({
      role: msg.bot_id || msg.user === botUserId ? ("assistant" as const) : ("user" as const),
      content: stripMentions(msg.text ?? ""),
    }));

  return {
    messages,
    depth: slackMessages.length,
  };
}

/** Remove Slack user mentions like <@U12345> from text */
function stripMentions(text: string): string {
  return text.replace(/<@[A-Z0-9]+>/g, "").trim();
}
