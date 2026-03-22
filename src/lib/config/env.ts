import { z } from "zod";

const envSchema = z.object({
  // Slack
  SLACK_SIGNING_SECRET: z.string().min(1, "SLACK_SIGNING_SECRET is required"),
  SLACK_BOT_TOKEN: z.string().startsWith("xoxb-", "SLACK_BOT_TOKEN must start with xoxb-"),
  SLACK_APP_TOKEN: z.string().startsWith("xapp-", "SLACK_APP_TOKEN must start with xapp-"),

  // NVIDIA NIM (Nemotron)
  NVIDIA_API_KEY: z.string().min(1, "NVIDIA_API_KEY is required"),
  NVIDIA_MODEL: z.string().default("nvidia/llama-3.3-nemotron-super-49b-v1"),
  NVIDIA_BASE_URL: z.string().url().default("https://integrate.api.nvidia.com/v1"),

  // Anthropic (Claude)
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  CLAUDE_MODEL: z.string().default("claude-sonnet-4-20250514"),

  // Server
  PORT: z.coerce.number().default(3000),

  // Rate limiting
  RATE_LIMIT_MAX_PER_MINUTE: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_MAX_PER_HOUR: z.coerce.number().int().positive().default(200),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
