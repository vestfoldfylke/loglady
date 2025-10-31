import assert from 'node:assert';
import { describe, it } from 'node:test';

import { logger } from '../';

const logFunctions = {
  debug: logger.debug,
  info: logger.info,
  warn: logger.warn,
  error: logger.error
};

const mockStdoutAndCallLogger = (callLoggerFunc: Function): string => {
  let output: string = '';
  const originalWrite = process.stdout.write;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  process.stdout.write = (chunk: any, ...args: any[]): boolean => {
    output += chunk;
    return originalWrite.call(process.stdout, chunk, ...args);
  };
  
  callLoggerFunc();

  process.stdout.write = originalWrite;
  
  return output;
};

describe('loglady 🪵  should not throw errors during logging', () => {
  Object.entries(logFunctions).forEach(([level, logFunction]) => {
    it(`when "${level}" is called with messageTemplate only`, () => {
      assert.doesNotThrow(() => logFunction.call(logger, `This is ${level} message`));
    });

    it(`when "${level}" is called with messageTemplate and 1 parameter`, () => {
      assert.doesNotThrow(() => logFunction.call(logger, `This is ${level} message: {Message}`, 'loglady test'));
    });
  });

  it('when "error" is called with exception and messageTemplate only', () => {
    assert.doesNotThrow(() => logger.errorException(new Error('Test'), 'This is an error message'));
  });

  it('when "error" is called with exception, messageTemplate and 1 parameter', () => {
    assert.doesNotThrow(() => logger.errorException(new Error('Test'), 'This is an error message: {Message}', 'loglady test'));
  });
});

describe('loglady 🪵  should throw errors during logging', () => {
  Object.entries(logFunctions).forEach(([level, logFunction]) => {
    it(`when "${level}" is called with messageTemplate with 1 placeholder but 0 parameters`, () => {
      assert.throws(() => logFunction.call(logger, `This is ${level} message: {Message}`));
    });

    it(`when "${level}" is called with messageTemplate with 1 placeholder but 2 parameters`, () => {
      assert.throws(() => logFunction.call(logger, `This is ${level} message: {Message}`, 'loglady test', 'makes no sense'));
    });
  });

  it('when "error" is called with exception and messageTemplate with 1 placeholder but 0 parameters', () => {
    assert.throws(() => logger.errorException(new Error('Test'), 'This is an error message: {Message}'));
  });

  it('when "error" is called with exception and messageTemplate with 1 placeholder but 2 parameters', () => {
    assert.throws(() => logger.errorException(new Error('Test'), 'This is an error message: {Message}', 'loglady test', 'makes no sense'));
  });
});

describe('loglady 🪵  logConfig should be callable multiple times', () => {
  it('should be empty initially and only contain updated property after calling logConfig', () => {
    const contextIdStr = 'CONTEXT_ID';
    const prefixStr = 'PREFIX';
    const suffixStr = 'SUFFIX';

    const initialOutput = mockStdoutAndCallLogger(() => logger.info('Initial log message'));
    assert.ok(!initialOutput.includes(contextIdStr));
    assert.ok(!initialOutput.includes(prefixStr));
    assert.ok(!initialOutput.includes(suffixStr));

    logger.logConfig({
      contextId: contextIdStr
    });

    const afterContextOutput = mockStdoutAndCallLogger(() => logger.info('Log message after setting contextId'));
    assert.ok(afterContextOutput.includes(contextIdStr));
    assert.ok(!afterContextOutput.includes(prefixStr));
    assert.ok(!afterContextOutput.includes(suffixStr));

    logger.logConfig({
      prefix: prefixStr
    });

    const afterPrefixOutput = mockStdoutAndCallLogger(() => logger.info('Log message after setting prefix'));
    assert.ok(afterPrefixOutput.includes(contextIdStr));
    assert.ok(afterPrefixOutput.includes(prefixStr));
    assert.ok(!afterPrefixOutput.includes(suffixStr));

    logger.logConfig({
      suffix: suffixStr
    });

    const afterSuffixOutput = mockStdoutAndCallLogger(() => logger.info('Log message after setting suffix'));
    assert.ok(afterSuffixOutput.includes(contextIdStr));
    assert.ok(afterSuffixOutput.includes(prefixStr));
    assert.ok(afterSuffixOutput.includes(suffixStr));

    logger.logConfig({
      contextId: undefined
    });

    const afterContextResetOutput = mockStdoutAndCallLogger(() => logger.info('Log message after resetting contextId'));
    assert.ok(!afterContextResetOutput.includes(contextIdStr));
    assert.ok(afterContextResetOutput.includes(prefixStr));
    assert.ok(afterContextResetOutput.includes(suffixStr));
    
    logger.logConfig({
      prefix: undefined
    });

    const afterSuffixResetOutput = mockStdoutAndCallLogger(() => logger.info('Log message after resetting prefix'));
    assert.ok(!afterSuffixResetOutput.includes(contextIdStr));
    assert.ok(!afterSuffixResetOutput.includes(prefixStr));
    assert.ok(afterSuffixResetOutput.includes(suffixStr));

    logger.logConfig({
      suffix: undefined
    });

    const finalOutput = mockStdoutAndCallLogger(() => logger.info('Final log message'));
    assert.ok(!finalOutput.includes(contextIdStr));
    assert.ok(!finalOutput.includes(prefixStr));
    assert.ok(!finalOutput.includes(suffixStr));
  });
});