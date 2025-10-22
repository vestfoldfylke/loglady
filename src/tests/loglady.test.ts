import assert from 'node:assert';
import { describe, it } from 'node:test';

import { logger } from '../';

const logFunctions = {
  debug: logger.debug,
  info: logger.info,
  warn: logger.warn,
  error: logger.error,
  critical: logger.critical,
  fatal: logger.fatal
};

const logExceptionFunctions = {
  errorException: logger.errorException,
  criticalException: logger.criticalException,
  fatalException: logger.fatalException
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

  Object.entries(logExceptionFunctions).forEach(([level, logExceptionFunction]) => {
    it(`when "${level}" is called with exception and messageTemplate only`, () => {
      assert.doesNotThrow(() => logExceptionFunction.call(logger, new Error('Test'), `This is ${level} message`));
    });

    it(`when "${level}" is called with exception, messageTemplate and 1 parameter`, () => {
      assert.doesNotThrow(() => logExceptionFunction.call(logger, new Error('Test'), `This is ${level} message: {Message}`, 'loglady test'));
    });
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

  Object.entries(logExceptionFunctions).forEach(([level, logExceptionFunction]) => {
    it(`when "${level}" is called with exception and messageTemplate with 1 placeholder but 0 parameters`, () => {
      assert.throws(() => logExceptionFunction.call(logger, new Error('Test'), `This is ${level} message: {Message}`));
    });

    it(`when "${level}" is called with exception and messageTemplate with 1 placeholder but 2 parameters`, () => {
      assert.throws(() => logExceptionFunction.call(logger, new Error('Test'), `This is ${level} message: {Message}`, 'loglady test', 'makes no sense'));
    });
  });
});