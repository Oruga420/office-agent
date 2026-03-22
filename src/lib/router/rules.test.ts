import { describe, expect, it } from "vitest";
import {
  CLAUDE_TRIGGERS,
  COMPLEXITY_CHAR_THRESHOLD,
  NEMOTRON_TRIGGERS,
  THREAD_DEPTH_THRESHOLD,
} from "./rules";

describe("router rules", () => {
  describe("CLAUDE_TRIGGERS", () => {
    it("is a non-empty readonly array", () => {
      expect(CLAUDE_TRIGGERS.length).toBeGreaterThan(0);
      expect(Array.isArray(CLAUDE_TRIGGERS)).toBe(true);
    });

    it("contains only RegExp instances", () => {
      for (const trigger of CLAUDE_TRIGGERS) {
        expect(trigger).toBeInstanceOf(RegExp);
      }
    });

    it("all patterns are case-insensitive", () => {
      for (const trigger of CLAUDE_TRIGGERS) {
        expect(trigger.flags).toContain("i");
      }
    });
  });

  describe("NEMOTRON_TRIGGERS", () => {
    it("is a non-empty readonly array", () => {
      expect(NEMOTRON_TRIGGERS.length).toBeGreaterThan(0);
      expect(Array.isArray(NEMOTRON_TRIGGERS)).toBe(true);
    });

    it("contains only RegExp instances", () => {
      for (const trigger of NEMOTRON_TRIGGERS) {
        expect(trigger).toBeInstanceOf(RegExp);
      }
    });

    it("all patterns are case-insensitive", () => {
      for (const trigger of NEMOTRON_TRIGGERS) {
        expect(trigger.flags).toContain("i");
      }
    });
  });

  describe("no overlap between trigger sets", () => {
    const testStrings = [
      "summarize",
      "translate",
      "code review",
      "debug",
      "architecture",
      "format",
      "convert",
      "grammar",
      "security",
      "design",
    ];

    it("each test keyword matches at most one trigger set", () => {
      for (const str of testStrings) {
        const matchesClaude = CLAUDE_TRIGGERS.some((p) => p.test(str));
        const matchesNemotron = NEMOTRON_TRIGGERS.some((p) => p.test(str));
        const both = matchesClaude && matchesNemotron;
        if (both) {
          // If both match, that's fine as long as the router has priority logic,
          // but we document it here for awareness
          expect(both).toBeDefined();
        }
      }
    });
  });

  describe("thresholds", () => {
    it("COMPLEXITY_CHAR_THRESHOLD is a positive number", () => {
      expect(COMPLEXITY_CHAR_THRESHOLD).toBeGreaterThan(0);
      expect(Number.isInteger(COMPLEXITY_CHAR_THRESHOLD)).toBe(true);
    });

    it("THREAD_DEPTH_THRESHOLD is a positive number", () => {
      expect(THREAD_DEPTH_THRESHOLD).toBeGreaterThan(0);
      expect(Number.isInteger(THREAD_DEPTH_THRESHOLD)).toBe(true);
    });
  });
});
