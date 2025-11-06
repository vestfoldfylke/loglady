import assert from "node:assert";
import { describe, it } from "node:test";

import { logger } from "../";

const logFunctions = {
  debug: logger.debug,
  info: logger.info,
  warn: logger.warn,
  error: logger.error
};

const mockStdoutAndCallLogger = (callLoggerFunc: () => void): string => {
  let output: string = "";
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;

  // biome-ignore lint/suspicious/noExplicitAny: allow any for process.stdout.write override
  process.stdout.write = (chunk: any, ...args: any[]): boolean => {
    output += chunk;
    return originalStdoutWrite.call(process.stdout, chunk, ...args);
  };

  // biome-ignore lint/suspicious/noExplicitAny: allow any for process.stderr.write override
  process.stderr.write = (chunk: any, ...args: any[]): boolean => {
    output += chunk;
    return originalStderrWrite.call(process.stderr, chunk, ...args);
  };

  callLoggerFunc();

  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;

  return output;
};

describe("loglady 🪵  should not throw errors during logging", () => {
  Object.entries(logFunctions).forEach(([level, logFunction]) => {
    it(`when "${level}" is called with messageTemplate only`, () => {
      assert.doesNotThrow(() => {
        const output = mockStdoutAndCallLogger(() => logFunction.call(logger, `This is ${level} message`));
        assert.ok(!output.includes(": NULL"));
      });
    });

    it(`when "${level}" is called with messageTemplate and 1 parameter`, () => {
      assert.doesNotThrow(() => {
        const output = mockStdoutAndCallLogger(() => logFunction.call(logger, `This is ${level} message: {Message}`, "loglady test"));
        assert.ok(output.includes(": loglady test"));
        assert.ok(!output.includes(": NULL"));
      });
    });

    it(`when "${level}" is called with messageTemplate and 1 parameter which is undefined`, () => {
      assert.doesNotThrow(() => {
        const output = mockStdoutAndCallLogger(() => logFunction.call(logger, `This is ${level} message: {Message}`, undefined));
        assert.ok(output.includes(": NULL"));
        assert.ok(!output.includes("undefined"));
      });
    });

    it(`when "${level}" is called with messageTemplate and 1 parameter which is null`, () => {
      assert.doesNotThrow(() => {
        const output = mockStdoutAndCallLogger(() => logger.error(`This is ${level} message: {Message}`, null));
        assert.ok(output.includes(": NULL"));
        assert.ok(!output.includes("undefined"));
      });
    });
  });

  it('when "error" is called with exception and messageTemplate only', () => {
    assert.doesNotThrow(() => {
      const output = mockStdoutAndCallLogger(() => logger.errorException(new Error("Test"), "This is an error message"));
      assert.ok(!output.includes(": NULL"));
    });
  });

  it('when "error" is called with exception, messageTemplate and 1 parameter', () => {
    assert.doesNotThrow(() => {
      const output = mockStdoutAndCallLogger(() => logger.errorException(new Error("Test"), "This is an error message: {Message}", "loglady test"));
      assert.ok(output.includes(": loglady test"));
      assert.ok(!output.includes(": NULL"));
    });
  });

  it('when "error" is called with exception, messageTemplate and 1 parameter which is undefined', () => {
    assert.doesNotThrow(() => {
      const output = mockStdoutAndCallLogger(() => logger.errorException(new Error("Test"), "This is an error message: {Message}", undefined));
      assert.ok(output.includes(": NULL"));
      assert.ok(!output.includes("undefined"));
    });
  });

  it('when "error" is called with exception, messageTemplate and 1 parameter which is null', () => {
    assert.doesNotThrow(() => {
      const output = mockStdoutAndCallLogger(() => logger.errorException(new Error("Test"), "This is an error message: {Message}", null));
      assert.ok(output.includes(": NULL"));
      assert.ok(!output.includes("undefined"));
    });
  });
});

describe("loglady 🪵  should throw errors during logging", () => {
  Object.entries(logFunctions).forEach(([level, logFunction]) => {
    it(`when "${level}" is called with messageTemplate with 1 placeholder but 0 parameters`, () => {
      assert.throws(() => logFunction.call(logger, `This is ${level} message: {Message}`));
    });

    it(`when "${level}" is called with messageTemplate with 1 placeholder but 2 parameters`, () => {
      assert.throws(() => logFunction.call(logger, `This is ${level} message: {Message}`, "loglady test", "makes no sense"));
    });
  });

  it('when "error" is called with exception and messageTemplate with 1 placeholder but 0 parameters', () => {
    assert.throws(() => logger.errorException(new Error("Test"), "This is an error message: {Message}"));
  });

  it('when "error" is called with exception and messageTemplate with 1 placeholder but 2 parameters', () => {
    assert.throws(() => logger.errorException(new Error("Test"), "This is an error message: {Message}", "loglady test", "makes no sense"));
  });
});

describe("loglady 🪵  logConfig should be callable multiple times", () => {
  it("should be empty initially and only contain updated property after calling logConfig", () => {
    const contextIdStr = "CONTEXT_ID";
    const prefixStr = "PREFIX";
    const suffixStr = "SUFFIX";

    const initialOutput = mockStdoutAndCallLogger(() => logger.debug("Initial log message"));
    assert.ok(!initialOutput.includes(contextIdStr));
    assert.ok(!initialOutput.includes(prefixStr));
    assert.ok(!initialOutput.includes(suffixStr));

    logger.logConfig({
      contextId: contextIdStr
    });

    const afterContextOutput = mockStdoutAndCallLogger(() => logger.info("Log message after setting contextId"));
    assert.ok(afterContextOutput.includes(contextIdStr));
    assert.ok(!afterContextOutput.includes(prefixStr));
    assert.ok(!afterContextOutput.includes(suffixStr));

    logger.logConfig({
      prefix: prefixStr
    });

    const afterPrefixOutput = mockStdoutAndCallLogger(() => logger.warn("Log message after setting prefix"));
    assert.ok(afterPrefixOutput.includes(contextIdStr));
    assert.ok(afterPrefixOutput.includes(prefixStr));
    assert.ok(!afterPrefixOutput.includes(suffixStr));

    logger.logConfig({
      suffix: suffixStr
    });

    const afterSuffixOutput = mockStdoutAndCallLogger(() => logger.error("Log message after setting suffix"));
    assert.ok(afterSuffixOutput.includes(contextIdStr));
    assert.ok(afterSuffixOutput.includes(prefixStr));
    assert.ok(afterSuffixOutput.includes(suffixStr));

    logger.logConfig({
      contextId: undefined
    });

    const afterContextResetOutput = mockStdoutAndCallLogger(() => logger.errorException(new Error("Test"), "Log message after resetting contextId"));
    assert.ok(!afterContextResetOutput.includes(contextIdStr));
    assert.ok(afterContextResetOutput.includes(prefixStr));
    assert.ok(afterContextResetOutput.includes(suffixStr));

    logger.logConfig({
      prefix: undefined
    });

    const afterSuffixResetOutput = mockStdoutAndCallLogger(() => logger.debug("Log message after resetting prefix"));
    assert.ok(!afterSuffixResetOutput.includes(contextIdStr));
    assert.ok(!afterSuffixResetOutput.includes(prefixStr));
    assert.ok(afterSuffixResetOutput.includes(suffixStr));

    logger.logConfig({
      suffix: undefined
    });

    const finalOutput = mockStdoutAndCallLogger(() => logger.info("Final log message"));
    assert.ok(!finalOutput.includes(contextIdStr));
    assert.ok(!finalOutput.includes(prefixStr));
    assert.ok(!finalOutput.includes(suffixStr));
  });
});
