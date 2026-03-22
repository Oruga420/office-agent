import type { App } from "@slack/bolt";
import { registerDmListener } from "./dm";

export function registerMessages(app: App): void {
  registerDmListener(app);
}
