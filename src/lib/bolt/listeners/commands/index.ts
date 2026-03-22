import type { App } from "@slack/bolt";
import { registerAskCommand } from "./ask";
import { registerDeepCommand } from "./deep";

export function registerCommands(app: App): void {
  registerAskCommand(app);
  registerDeepCommand(app);
}
