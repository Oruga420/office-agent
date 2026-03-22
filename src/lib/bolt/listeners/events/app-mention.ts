import type { App } from "@slack/bolt";
import { chat } from "@/lib/models";
import { checkRateLimit } from "@/lib/rate-limit";
import { classifyMessage } from "@/lib/router/classify";
import { getThreadContext } from "../../thread-utils";
import { SYSTEM_PROMPT } from "../../system-prompt";
import type { ChatMessage } from "@/lib/models";

/**
 * @bot mention handler — auto-routes via classify, supports threads,
 * shows model tag and latency.
 */
export function registerAppMention(app: App): void {
  app.event("app_mention", async ({ event, client, say, context }) => {
    const { user: userId, text, thread_ts: threadTs, ts, channel } = event;

    if (!userId) return;

    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      await say({
        text: `Rate limit exceeded. Try again in ${rateLimit.retryAfterSeconds}s.`,
        thread_ts: threadTs ?? ts,
      });
      return;
    }

    const cleanText = text.replace(/<@[A-Z0-9]+>/g, "").trim();
    if (!cleanText) {
      await say({
        text: "How can I help? Mention me with a question.",
        thread_ts: threadTs ?? ts,
      });
      return;
    }

    if (cleanText.length > 4000) {
      await say({
        text: "Message too long. Please keep requests under 4,000 characters.",
        thread_ts: threadTs ?? ts,
      });
      return;
    }

    try {
      // Build message history from thread if applicable
      const messages: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];
      let threadDepth = 0;

      if (threadTs) {
        const botUserId = context.botUserId ?? "";
        const threadContext = await getThreadContext(client, channel, threadTs, botUserId);
        threadDepth = threadContext.depth;

        for (const msg of threadContext.messages) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      messages.push({ role: "user", content: cleanText });

      // Route the message
      const decision = classifyMessage({
        text: cleanText,
        threadDepth,
      });

      const response = await chat(decision.model, messages);

      const emoji = decision.model === "claude" ? "🧠" : "⚡";
      const label = decision.model === "claude" ? "Claude" : "Nemotron";
      const tag = `${emoji} ${label} · ${response.latencyMs}ms`;

      await say({
        text: `${response.text}\n\n_${tag}_`,
        thread_ts: threadTs ?? ts,
      });
    } catch {
      await say({
        text: "Something went wrong. Please try again.",
        thread_ts: threadTs ?? ts,
      });
    }
  });
}
