import {
  CLAUDE_TRIGGERS,
  COMPLEXITY_CHAR_THRESHOLD,
  NEMOTRON_TRIGGERS,
  THREAD_DEPTH_THRESHOLD,
} from "./rules";
import type { RouteDecision, RouterInput } from "./types";

function matchesTriggers(text: string, triggers: readonly RegExp[]): boolean {
  return triggers.some((pattern) => pattern.test(text));
}

export function classifyMessage(input: RouterInput): RouteDecision {
  const { text, forceModel, threadDepth } = input;

  // Priority 1: Force override (from /ask or /deep)
  if (forceModel) {
    return {
      model: forceModel,
      reason: `Forced to ${forceModel} by user command`,
      confidence: 1.0,
    };
  }

  // Priority 2: Claude triggers
  if (matchesTriggers(text, CLAUDE_TRIGGERS)) {
    return {
      model: "claude",
      reason: "Message matches Claude trigger pattern (complex task)",
      confidence: 0.85,
    };
  }

  // Priority 3: Nemotron triggers
  if (matchesTriggers(text, NEMOTRON_TRIGGERS)) {
    return {
      model: "nemotron",
      reason: "Message matches Nemotron trigger pattern (simple task)",
      confidence: 0.85,
    };
  }

  // Priority 4: Length heuristic
  if (text.length > COMPLEXITY_CHAR_THRESHOLD) {
    return {
      model: "claude",
      reason: `Message exceeds ${COMPLEXITY_CHAR_THRESHOLD} chars — likely complex`,
      confidence: 0.6,
    };
  }

  // Priority 5: Thread depth heuristic
  if (threadDepth !== undefined && threadDepth > THREAD_DEPTH_THRESHOLD) {
    return {
      model: "claude",
      reason: `Thread depth ${threadDepth} exceeds ${THREAD_DEPTH_THRESHOLD} — deep conversation`,
      confidence: 0.55,
    };
  }

  // Default: Nemotron for simple/general queries
  return {
    model: "nemotron",
    reason: "Default routing — no complex signals detected",
    confidence: 0.5,
  };
}
