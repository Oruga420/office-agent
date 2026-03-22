import { App } from "@slack/bolt";
import { VercelReceiver } from "@vercel/slack-bolt";
import { getEnv } from "@/lib/config/env";
import { registerListeners } from "./listeners";

let receiver: VercelReceiver | null = null;
let app: App | null = null;

function ensureInitialized(): { app: App; receiver: VercelReceiver } {
  if (receiver && app) {
    return { app, receiver };
  }

  const env = getEnv();

  receiver = new VercelReceiver({
    signingSecret: env.SLACK_SIGNING_SECRET,
  });

  app = new App({
    token: env.SLACK_BOT_TOKEN,
    signingSecret: env.SLACK_SIGNING_SECRET,
    receiver,
  });

  registerListeners(app);

  return { app, receiver };
}

export function getReceiver(): VercelReceiver {
  return ensureInitialized().receiver;
}
