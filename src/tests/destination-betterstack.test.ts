import assert from "node:assert";
import { afterEach, describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";

import BetterStack from "../destinations/BetterStack/index.js";

import type { BetterStackPayload } from "../types/destinations/betterstack.types.js";
import type { MessageObject } from "../types/log.types.js";

import { minimalPackage } from "./data/minimal-package.js";

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

  it("should catch and log errors during message POST request", async () => {
    process.env["BETTERSTACK_URL"] = "https://example.betterstack.com";
    process.env["BETTERSTACK_TOKEN"] = "example-token";

    const betterStackInstance = new BetterStack(minimalPackage);

    // Simulate an error during the POST request by mocking the fetch function
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("Simulated network error");
    };

    const messageObjectOne: MessageObject = {
      messageTemplate: "Test message one for error handling",
      message: "Test message one for error handling",
      properties: {}
    };

    const messageObjectTwo: MessageObject = {
      messageTemplate: "Test message two for error handling",
      message: "Test message two for error handling",
      properties: {}
    };

    // with 2 messages and flush between
    try {
      betterStackInstance.log(messageObjectOne, "WARN");
      betterStackInstance.flush();
      betterStackInstance.log(messageObjectTwo, "INFO");
      betterStackInstance.flush();
      assert.ok(true, "Error during POST request with flush should be caught and logged");
    } catch (error) {
      assert.ok(false, `Error during POST request with flush should be caught and logged, but error occurred: ${(error as Error).message}`);
    }

    await setTimeout(1000);

    // with 500 messages and only relying on batchTimer kicking in - should be split into 5 calls
    let fetchCallCount = 0;
    const fetchBatchSizes: number[] = [];
    globalThis.fetch = async (_input, init) => {
      fetchCallCount++;
      if (init?.body) {
        fetchBatchSizes.push((JSON.parse(init.body as string) as unknown[]).length);
      }
      throw new Error("Simulated network error");
    };

    try {
      for (let i = 0; i < 500; i++) {
        betterStackInstance.log(messageObjectOne, "WARN");
      }
      assert.strictEqual(fetchCallCount, 5, "500 messages with batch size 100 should result in 5 fetch calls");
      assert.deepStrictEqual(fetchBatchSizes, [100, 100, 100, 100, 100], "Each batch should contain 100 messages");
    } catch (error) {
      assert.ok(false, `Error during POST request without flush should be caught and logged, but error occurred: ${(error as Error).message}`);
    } finally {
      // Restore the original fetch function
      globalThis.fetch = originalFetch;
    }
  });
});
