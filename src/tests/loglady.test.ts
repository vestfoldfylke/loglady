import assert from 'node:assert';
import { describe, it } from 'node:test';

import { logger } from '../';

const logFunctions = {
  debug: logger.debug,
  info: logger.info,
  warn: logger.warn,
  error: logger.error
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