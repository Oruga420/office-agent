import { App, ExpressReceiver } from "@slack/bolt";
import { getEnv } from "@/lib/config/env";
import { registerListeners } from "./listeners";

let app: App | null = null;

function createApp(): App {
  const env = getEnv();

  const receiver = new ExpressReceiver({
    signingSecret: env.SLACK_SIGNING_SECRET,
  });

  const boltApp = new App({
    token: env.SLACK_BOT_TOKEN,
    receiver,
  });

  registerListeners(boltApp);
  return boltApp;
}

export function getApp(): App {
  if (!app) {
    app = createApp();
  }
  return app;
}

export async function start(): Promise<void> {
  const env = getEnv();
  const boltApp = getApp();
  const port = env.PORT;
  await boltApp.start(port);
  console.log(`Luna is running on port ${port}`);
}
