import { describe, expect, it } from "vitest";
import { classifyMessage } from "./classify";
import { COMPLEXITY_CHAR_THRESHOLD, THREAD_DEPTH_THRESHOLD } from "./rules";
import type { RouterInput } from "./types";

describe("classifyMessage", () => {
  // ── Priority 1: Force override ──────────────────────────────────

  describe("forced model override", () => {
    it("routes to claude when forceModel is claude", () => {
      const input: RouterInput = { text: "hello", forceModel: "claude" };
      const result = classifyMessage(input);
      expect(result.model).toBe("claude");
      expect(result.confidence).toBe(1.0);
      expect(result.reason).toContain("Forced");
    });

    it("routes to nemotron when forceModel is nemotron", () => {
      const input: RouterInput = { text: "hello", forceModel: "nemotron" };
      const result = classifyMessage(input);
      expect(result.model).toBe("nemotron");
      expect(result.confidence).toBe(1.0);
      expect(result.reason).toContain("Forced");
    });

    it("overrides Claude triggers when forced to nemotron", () => {
      const input: RouterInput = {
        text: "review my code for security issues",
        forceModel: "nemotron",
      };
      const result = classifyMessage(input);
      expect(result.model).toBe("nemotron");
      expect(result.confidence).toBe(1.0);
    });

    it("overrides Nemotron triggers when forced to claude", () => {
      const input: RouterInput = {
        text: "summarize this paragraph",
        forceModel: "claude",
      };
      const result = classifyMessage(input);
      expect(result.model).toBe("claude");
      expect(result.confidence).toBe(1.0);
    });
  });

  // ── Priority 2: Claude triggers ─────────────────────────────────

  describe("Claude trigger patterns", () => {
    const claudeInputs = [
      { text: "can you review my code?", label: "code review" },
      { text: "review this code please", label: "review this code" },
      { text: "I need help debugging this error", label: "debugging" },
      { text: "what is the architecture of this system?", label: "architecture" },
      { text: "check the security of this endpoint", label: "security" },
      { text: "analyze these logs for anomalies", label: "analyze" },
      { text: "compare these two approaches", label: "compare" },
      { text: "design a new API endpoint", label: "design" },
      { text: "this is a multi-step process", label: "multi-step" },
      { text: "write a function to parse JSON", label: "write code" },
      { text: "create a class for user management", label: "create class" },
      { text: "build a component for the dashboard", label: "build component" },
      { text: "implement a script for data migration", label: "implement script" },
    ];

    for (const { text, label } of claudeInputs) {
      it(`routes "${label}" to claude`, () => {
        const result = classifyMessage({ text });
        expect(result.model).toBe("claude");
        expect(result.confidence).toBe(0.85);
        expect(result.reason).toContain("Claude trigger");
      });
    }

    it("is case-insensitive for Claude triggers", () => {
      const result = classifyMessage({ text: "DEBUGGING a SECURITY issue" });
      expect(result.model).toBe("claude");
    });
  });

  // ── Priority 3: Nemotron triggers ───────────────────────────────

  describe("Nemotron trigger patterns", () => {
    const nemotronInputs = [
      { text: "summarize the meeting notes", label: "summarize" },
      { text: "translate this to Spanish", label: "translate" },
      { text: "what is a closure in JavaScript?", label: "what is" },
      { text: "who is the CEO of Anthropic?", label: "who is" },
      { text: "when was React released?", label: "when was" },
      { text: "where does this file live?", label: "where does" },
      { text: "list all the endpoints", label: "list all" },
      { text: "list the dependencies", label: "list the" },
      { text: "define microservices", label: "define" },
      { text: "format this JSON", label: "format" },
      { text: "convert this to YAML", label: "convert" },
      { text: "fix the grammar in this sentence", label: "grammar" },
    ];

    for (const { text, label } of nemotronInputs) {
      it(`routes "${label}" to nemotron`, () => {
        const result = classifyMessage({ text });
        expect(result.model).toBe("nemotron");
        expect(result.confidence).toBe(0.85);
        expect(result.reason).toContain("Nemotron trigger");
      });
    }

    it("is case-insensitive for Nemotron triggers", () => {
      const result = classifyMessage({ text: "SUMMARIZE the report" });
      expect(result.model).toBe("nemotron");
    });
  });

  // ── Priority ordering: Claude > Nemotron ────────────────────────

  describe("trigger priority", () => {
    it("prefers Claude triggers over Nemotron triggers when both match", () => {
      // "analyze" is Claude trigger, "what is" is Nemotron trigger
      const result = classifyMessage({ text: "analyze what is happening here" });
      expect(result.model).toBe("claude");
    });
  });

  // ── Priority 4: Length heuristic ────────────────────────────────

  describe("length-based complexity heuristic", () => {
    it("routes long messages to claude", () => {
      const longText = "a".repeat(COMPLEXITY_CHAR_THRESHOLD + 1);
      const result = classifyMessage({ text: longText });
      expect(result.model).toBe("claude");
      expect(result.confidence).toBe(0.6);
      expect(result.reason).toContain("chars");
    });

    it("does not trigger length heuristic at exactly the threshold", () => {
      const exactText = "a".repeat(COMPLEXITY_CHAR_THRESHOLD);
      const result = classifyMessage({ text: exactText });
      // Should fall through to default (nemotron)
      expect(result.model).toBe("nemotron");
    });

    it("does not trigger length heuristic below threshold", () => {
      const shortText = "a".repeat(COMPLEXITY_CHAR_THRESHOLD - 1);
      const result = classifyMessage({ text: shortText });
      expect(result.model).toBe("nemotron");
    });
  });

  // ── Priority 5: Thread depth heuristic ──────────────────────────

  describe("thread depth heuristic", () => {
    it("routes deep threads to claude", () => {
      const result = classifyMessage({
        text: "ok thanks",
        threadDepth: THREAD_DEPTH_THRESHOLD + 1,
      });
      expect(result.model).toBe("claude");
      expect(result.confidence).toBe(0.55);
      expect(result.reason).toContain("Thread depth");
    });

    it("does not trigger at exactly the threshold", () => {
      const result = classifyMessage({
        text: "ok thanks",
        threadDepth: THREAD_DEPTH_THRESHOLD,
      });
      expect(result.model).toBe("nemotron");
    });

    it("does not trigger when threadDepth is undefined", () => {
      const result = classifyMessage({ text: "ok thanks" });
      expect(result.model).toBe("nemotron");
    });

    it("does not trigger for shallow threads", () => {
      const result = classifyMessage({ text: "ok thanks", threadDepth: 1 });
      expect(result.model).toBe("nemotron");
    });
  });

  // ── Default fallback ───────────────────────────────────────────

  describe("default routing", () => {
    it("defaults to nemotron for generic messages", () => {
      const result = classifyMessage({ text: "hello there" });
      expect(result.model).toBe("nemotron");
      expect(result.confidence).toBe(0.5);
      expect(result.reason).toContain("Default");
    });

    it("defaults to nemotron for empty-ish messages", () => {
      const result = classifyMessage({ text: "ok" });
      expect(result.model).toBe("nemotron");
      expect(result.confidence).toBe(0.5);
    });
  });

  // ── Return value immutability ───────────────────────────────────

  describe("immutability", () => {
    it("returns a readonly RouteDecision", () => {
      const result = classifyMessage({ text: "hello" });
      expect(result).toHaveProperty("model");
      expect(result).toHaveProperty("reason");
      expect(result).toHaveProperty("confidence");
      // Verify it's a plain object (not mutated from a shared reference)
      const result2 = classifyMessage({ text: "hello" });
      expect(result).not.toBe(result2);
      expect(result).toEqual(result2);
    });
  });
});
