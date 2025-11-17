import assert from "node:assert";
import { describe, it } from "node:test";

import Console from "../destinations/Console/index.js";

import type { ConsolePayload } from "../types/destinations/console.types";
import type { MessageObject } from "../types/log.types";

import { minimalPackage } from "./lib/minimal-package";

const logLevels: string[] = ["debug", "info", "warn", "error", "DEBUG", "INFO", "WARN", "ERROR"];

describe("Console log destination", () => {
  it("should be active when environment variable 'CONSOLE_ENABLED' is not set", () => {
    const consoleInstance = new Console(minimalPackage);

    assert.strictEqual(consoleInstance.active, true);
  });

  it("should be active when environment variable 'CONSOLE_ENABLED' is set as true", () => {
    process.env["CONSOLE_ENABLED"] = "true";

    const consoleInstance = new Console(minimalPackage);

    assert.strictEqual(consoleInstance.active, true);
  });

  it("should NOT be active when environment variable 'CONSOLE_ENABLED' is set as false", () => {
    process.env["CONSOLE_ENABLED"] = "false";

    const consoleInstance = new Console(minimalPackage);

    assert.strictEqual(consoleInstance.active, false);
  });

  it("payload should include [ContextId] when present in messageObject", () => {
    const messageObject: MessageObject = {
      messageTemplate: "Test message with ContextId",
      message: "Test message with ContextId",
      properties: {
        ContextId: "12345"
      }
    };

    const consoleInstance = new Console(minimalPackage);
    const payload: ConsolePayload = consoleInstance.createPayload<ConsolePayload>(messageObject, "INFO");

    assert.notEqual(payload, null, "Payload should not be null");
    assert.ok(payload.filter((part) => part === `[${messageObject.properties["ContextId"]}]`).length === 1, "Payload should include [ContextId]");
    assert.ok(payload.length === 4, "Payload should have 4 parts when ContextId is present");
  });

  it("payload should NOT include [ContextId] when not present in messageObject", () => {
    const messageObject: MessageObject = {
      messageTemplate: "Test message with ContextId",
      message: "Test message with ContextId",
      properties: {}
    };

    const consoleInstance = new Console(minimalPackage);
    const payload: ConsolePayload = consoleInstance.createPayload<ConsolePayload>(messageObject, "INFO");

    assert.notEqual(payload, null, "Payload should not be null");
    assert.ok(payload.length === 3, "Payload should have 3 parts when ContextId is not present");
  });

  logLevels.forEach((level: string) => {
    it(`should support log level ${level}`, () => {
      process.env["CONSOLE_MIN_LOG_LEVEL"] = level;

      try {
        new Console(minimalPackage);
        assert.ok(true, `Log level ${level} should be supported`);
      } catch (error) {
        assert.ok(false, `Log level ${level} should be supported, but error occurred: ${(error as Error).message}`);
      }
    });
  });

  it("should support default log level", () => {
    try {
      new Console(minimalPackage);
      assert.ok(true, "Default log level should be supported");
    } catch (error) {
      assert.ok(false, `Default log level should be supported, but error occurred: ${(error as Error).message}`);
    }
  });
});
