import { Logger } from './lib/logger.js';

import type { LogConfig } from './types/log-config.types';
import type { MessageParameter, TrackedPromise } from './types/log.types';

const _queue: TrackedPromise[] = [];

const _logger = new Logger(_queue);

let _logConfig: LogConfig = {};

export namespace logger {
  // noinspection JSUnusedGlobalSymbols
  /**
   * Should be called before application exits or session is finished, to ensure all log messages have been processed (either successfully or with an error)
   */
  export async function flush(): Promise<void> {
    await Promise.allSettled(_queue.map((trackedPromise: TrackedPromise) => trackedPromise.promise));
    _queue.splice(0, _queue.length, ..._queue.filter((trackedPromise: TrackedPromise) => !trackedPromise.isSettled));
  }

  /**
   * Configure optional logging settings<br />
   * Can be called multiple times to update specific settings<br /><br />
   *
   * Example:<br />
   * ```typescript
   * logConfig({
   *   contextId: '12345-abcde-67890-fghij',
   *   prefix: 'Will be prepended to the beginning of each log message',
   *   suffix: 'Will be appended to the end of each log message',
   * });
   * ```
   *
   * @param logConfig - Log configuration settings
   */
  export function logConfig(logConfig: LogConfig): void {
    _logConfig = {
      ..._logConfig,
      ...logConfig
    };
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Log a debug level message<br />
   *
   * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
   * Example:<br />
   * ```typescript
   * const username = 'john_doe';
   * const ipAddress = '127.0.0.1';
   *
   * // with placeholders
   * debug('Username {Username} has logged in from IP {IPAddress}', username, ipAddress);
   *
   * // without placeholders
   * debug('Application has started');
   * ```
   *
   * @param messageTemplate - Message template with optional placeholders
   * @param params - Parameters to replace placeholders in message template
   */
  export function debug(messageTemplate: string, ...params: MessageParameter[]): void {
    _logger.log(_logConfig, messageTemplate, 'DEBUG', undefined, ...params);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Log an info level message<br />
   *
   * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
   * Example:<br />
   * ```typescript
   * const username = 'john_doe';
   * const ipAddress = '127.0.0.1';
   *
   * // with placeholders
   * info('Username {Username} has logged in from IP {IPAddress}', username, ipAddress);
   *
   * // without placeholders
   * info('Application has started');
   * ```
   *
   * @param messageTemplate - Message template with optional placeholders
   * @param params - Parameters to replace placeholders in message template
   */
  export function info(messageTemplate: string, ...params: MessageParameter[]): void {
    _logger.log(_logConfig, messageTemplate, 'INFO', undefined, ...params);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Log a warning level message<br />
   *
   * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
   * Example:<br />
   * ```typescript
   * const applicationName = 'foo';
   * const minutes = 3;
   *
   * // with placeholders
   * warn('Application {ApplicationName} considers shutting down in {Minutes} minutes', applicationName, minutes);
   *
   * // without placeholders
   * warn('Application considers shutting down');
   * ```
   *
   * @param messageTemplate - Message template with optional placeholders
   * @param params - Parameters to replace placeholders in message template
   */
  export function warn(messageTemplate: string, ...params: MessageParameter[]): void {
    _logger.log(_logConfig, messageTemplate, 'WARN', undefined, ...params);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Log an error level message<br />
   *
   * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
   * Example:<br />
   * ```typescript
   * const applicationName = 'foo';
   * const minutes = 3;
   *
   * // with placeholders
   * error('Application {ApplicationName} shut down after {Minutes} minutes', applicationName, minutes);
   *
   * // without placeholders
   * error('Application shut down');
   * ```
   *
   * @param messageTemplate - Message template with optional placeholders
   * @param params - Parameters to replace placeholders in message template
   */
  export function error(messageTemplate: string, ...params: MessageParameter[]): void {
    _logger.log(_logConfig, messageTemplate, 'ERROR', undefined, ...params);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Log an error level message with an exception<br />
   *
   * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
   * Example:<br />
   * ```typescript
   * const applicationName = 'foo';
   * const minutes = 3;
   *
   * try {
   *   // some code that throws an error
   * } catch (error) {
   *   // with placeholders
   *   errorException(error, 'Application {ApplicationName} shut down after {Minutes} minutes', applicationName, minutes);
   *
   *   // without placeholders
   *   errorException(error, 'Application shut down');
   * }
   * ```
   *
   * @param exception - An error or exception
   * @param messageTemplate - Message template with optional placeholders
   * @param params - Parameters to replace placeholders in message template
   */
  export function errorException(exception: unknown, messageTemplate: string, ...params: MessageParameter[]): void {
    _logger.log(_logConfig, messageTemplate, 'ERROR', exception, ...params);
  }
}