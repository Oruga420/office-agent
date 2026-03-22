import type { App } from "@slack/bolt";
import { registerCommands } from "./commands";
import { registerEvents } from "./events";
import { registerMessages } from "./messages";

export function registerListeners(app: App): void {
  registerCommands(app);
  registerEvents(app);
  registerMessages(app);
}
