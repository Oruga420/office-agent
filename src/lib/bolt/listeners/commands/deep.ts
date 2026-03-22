import type { App } from "@slack/bolt";
import { chat } from "@/lib/models";
import { checkRateLimit } from "@/lib/rate-limit";
import { SYSTEM_PROMPT } from "../../system-prompt";

/**
 * /deep command — forces Claude, responds in_channel.
 */
export function registerDeepCommand(app: App): void {
  app.command("/deep", async ({ command, ack, respond }) => {
    await ack();

    const { user_id: userId, text } = command;

    if (!text.trim()) {
      await respond({
        response_type: "ephemeral",
        text: "Please provide a question. Usage: `/deep <your question>`",
      });
      return;
    }

    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      await respond({
        response_type: "ephemeral",
        text: `Rate limit exceeded. Try again in ${rateLimit.retryAfterSeconds}s.`,
      });
      return;
    }

    if (text.length > 4000) {
      await respond({
        response_type: "ephemeral",
        text: "Message too long. Please keep requests under 4,000 characters.",
      });
      return;
    }

    try {
      const response = await chat("claude", [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ]);

      const tag = `🧠 Claude · ${response.latencyMs}ms`;

      await respond({
        response_type: "in_channel",
        text: `${response.text}\n\n_${tag}_`,
      });
    } catch {
      await respond({
        response_type: "ephemeral",
        text: "Something went wrong. Please try again.",
      });
    }
  });
}
