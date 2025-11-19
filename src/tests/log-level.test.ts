import assert from "node:assert";
import { describe, it } from "node:test";

import { canLogAtLevel, validateLogLevel } from "../lib/log-level.js";

import type { LogLevel } from "../types/log.types";

const logLevels: string[] = ["debug", "info", "warn", "error", "DEBUG", "INFO", "WARN", "ERROR"];

describe("Log Level Utilities", () => {
  describe("canLogAtLevel", () => {
    it("should return true when message log level is equal to minimum log level", () => {
      assert.strictEqual(canLogAtLevel("INFO", "INFO"), true);
    });

    it("should return true when message log level is greater than minimum log level", () => {
      assert.strictEqual(canLogAtLevel("WARN", "INFO"), true);
    });

    it("should return false when message log level is lower than minimum log level", () => {
      assert.strictEqual(canLogAtLevel("WARN", "ERROR"), false);
    });
  });

  describe("validateLogLevel", () => {
    logLevels.forEach((level: string) => {
      it(`should return true for log level ${level}`, () => {
        assert.strictEqual(validateLogLevel(level as LogLevel), true, `Log level ${level} should be supported`);
      });
    });

    it("should return false for non-existing log level 'CRAZY'", () => {
      assert.strictEqual(validateLogLevel("CRAZY" as LogLevel), false, "Log level CRAZY should NOT be supported");
    });

    it("should return false for wrongly cased log level 'Warn'", () => {
      const levelCrazy = "Warn";
      assert.strictEqual(validateLogLevel(levelCrazy as LogLevel), false, `Wrongly cased log level ${levelCrazy} should NOT be supported`);
    });
  });
});
