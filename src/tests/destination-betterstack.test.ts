import assert from "node:assert";
import { afterEach, describe, it } from "node:test";

import BetterStack from "../destinations/BetterStack/index.js";

import type { BetterStackPayload } from "../types/destinations/betterstack.types";
import type { MessageObject } from "../types/log.types";

import { minimalPackage } from "./lib/minimal-package";

const originalEnv = { ...process.env };

const logLevels: string[] = ["debug", "info", "warn", "error", "DEBUG", "INFO", "WARN", "ERROR"];

describe("BetterStack log destination", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should be active when environment variable 'BETTERSTACK_URL' AND 'BETTERSTACK_TOKEN' is set", () => {
    process.env["BETTERSTACK_URL"] = "https://example.betterstack.com";
    process.env["BETTERSTACK_TOKEN"] = "example-token";

    const betterStackInstance = new BetterStack(minimalPackage);

    assert.strictEqual(betterStackInstance.active, true);
  });

  it("should NOT be active when environment variable 'BETTERSTACK_URL' AND 'BETTERSTACK_TOKEN' is not set", () => {
    const betterStackInstance = new BetterStack(minimalPackage);

    assert.strictEqual(betterStackInstance.active, false);
  });

  it("should NOT be active when environment variable 'BETTERSTACK_URL' is set but 'BETTERSTACK_TOKEN' is not set", () => {
    process.env["BETTERSTACK_URL"] = "https://example.betterstack.com";

    const betterStackInstance = new BetterStack(minimalPackage);

    assert.strictEqual(betterStackInstance.active, false);
  });

  it("should NOT be active when environment variable 'BETTERSTACK_URL' is not set but 'BETTERSTACK_TOKEN' is set", () => {
    process.env["BETTERSTACK_TOKEN"] = "example-token";

    const betterStackInstance = new BetterStack(minimalPackage);

    assert.strictEqual(betterStackInstance.active, false);
  });

  it("payload should include ContextId when present in messageObject", () => {
    const messageObject: MessageObject = {
      messageTemplate: "Test message with ContextId",
      message: "Test message with ContextId",
      properties: {
        ContextId: "12345"
      }
    };

    const betterStackInstance = new BetterStack(minimalPackage);
    const payload: BetterStackPayload = betterStackInstance.createPayload<BetterStackPayload>(messageObject, "INFO");

    assert.notEqual(payload, null, "Payload should not be null");
    assert.strictEqual(
      payload.properties["ContextId"],
      messageObject.properties["ContextId"],
      "Payload should include ContextId when present in messageObject"
    );
  });

  it("payload should include 'exception' when present in messageObject", () => {
    const messageObject: MessageObject = {
      messageTemplate: "Test message with ContextId",
      message: "Test message with ContextId",
      exception: new Error("Test error").stack,
      properties: {}
    };

    const betterStackInstance = new BetterStack(minimalPackage);
    const payload: BetterStackPayload = betterStackInstance.createPayload<BetterStackPayload>(messageObject, "INFO");

    assert.notEqual(payload, null, "Payload should not be null");
    assert.notEqual(payload.exception, null, "Payload should include exception when present in messageObject");
  });

  logLevels.forEach((level: string) => {
    it(`should support log level ${level}`, () => {
      process.env["BETTERSTACK_MIN_LOG_LEVEL"] = level;

      try {
        new BetterStack(minimalPackage);
        assert.ok(true, `Log level ${level} should be supported`);
      } catch (error) {
        assert.ok(false, `Log level ${level} should be supported, but error occurred: ${(error as Error).message}`);
      }
    });
  });

  it("should support default log level", () => {
    try {
      new BetterStack(minimalPackage);
      assert.ok(true, "Default log level should be supported");
    } catch (error) {
      assert.ok(false, `Default log level should be supported, but error occurred: ${(error as Error).message}`);
    }
  });
});
