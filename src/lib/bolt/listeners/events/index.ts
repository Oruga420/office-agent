import type { App } from "@slack/bolt";
import { registerAppMention } from "./app-mention";

export function registerEvents(app: App): void {
  registerAppMention(app);
}
