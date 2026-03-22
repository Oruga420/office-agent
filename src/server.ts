import { start } from "./lib/bolt/app";

start().catch((error) => {
  console.error("Failed to start Luna:", error);
  process.exit(1);
});
