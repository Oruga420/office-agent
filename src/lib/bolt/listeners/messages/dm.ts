import type { App } from "@slack/bolt";
import { chat } from "@/lib/models";
import { checkRateLimit } from "@/lib/rate-limit";
import { classifyMessage } from "@/lib/router/classify";
import { SYSTEM_PROMPT } from "../../system-prompt";

/**
 * Direct message handler — responds to DMs sent to the bot.
 * Auto-routes via classify, same as app_mention.
 */
export function registerDmListener(app: App): void {
  app.message(async ({ message, say }) => {
    // Only handle direct messages (im channel type)
    // Guard against subtypes (edits, deletes) and non-text messages
    const msg = message as unknown as Record<string, unknown>;
    if (typeof msg.text !== "string" || !msg.text) return;
    if (msg.subtype) return;
    if (msg.channel_type !== "im") return;

    const userId = msg.user as string | undefined;
    if (!userId) return;
    const text = msg.text as string;

    const ts = msg.ts as string;

    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      await say({
        text: `Rate limit exceeded. Try again in ${rateLimit.retryAfterSeconds}s.`,
        thread_ts: ts,
      });
      return;
    }

    if (text.length > 4000) {
      await say({
        text: "Message too long. Please keep requests under 4,000 characters.",
        thread_ts: ts,
      });
      return;
    }

    try {
      const decision = classifyMessage({ text });

      const response = await chat(decision.model, [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ]);

      const emoji = decision.model === "claude" ? "🧠" : "⚡";
      const label = decision.model === "claude" ? "Claude" : "Nemotron";
      const tag = `${emoji} ${label} · ${response.latencyMs}ms`;

      await say({
        text: `${response.text}\n\n_${tag}_`,
        thread_ts: ts,
      });
    } catch {
      await say({
        text: "Something went wrong. Please try again.",
        thread_ts: ts,
      });
    }
  });
}
