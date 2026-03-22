import { getEnv } from "@/lib/config/env";
import { countSince, recordRequest } from "./memory-store";

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly retryAfterSeconds?: number;
}

export function checkRateLimit(userId: string): RateLimitResult {
  const env = getEnv();
  const now = Date.now();

  const minuteAgo = now - 60 * 1000;
  const hourAgo = now - 60 * 60 * 1000;

  const countLastMinute = countSince(userId, minuteAgo);
  const countLastHour = countSince(userId, hourAgo);

  if (countLastMinute >= env.RATE_LIMIT_MAX_PER_MINUTE) {
    return {
      allowed: false,
      retryAfterSeconds: 60,
    };
  }

  if (countLastHour >= env.RATE_LIMIT_MAX_PER_HOUR) {
    return {
      allowed: false,
      retryAfterSeconds: 3600,
    };
  }

  recordRequest(userId);

  return { allowed: true };
}
