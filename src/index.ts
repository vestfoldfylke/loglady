import { Logger } from './lib/logger.js';

import type { MessageParameter, TrackedPromise } from './types/log.types';

const _queue: TrackedPromise[] = [];

const _logger = new Logger(_queue);

export namespace logger {
  // noinspection JSUnusedGlobalSymbols
  /**
   * Should be called before application exits or session is finished, to ensure all log messages have been processed (either successfully or with an error)
   */
  export async function flush(): Promise<void> {
    await Promise.allSettled(_queue);
    _queue.length = 0;
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
    _logger.log(messageTemplate, 'DEBUG', undefined, ...params);
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
    _logger.log(messageTemplate, 'INFO', undefined, ...params);
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
    _logger.log(messageTemplate, 'WARN', undefined, ...params);
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
    _logger.log(messageTemplate, 'ERROR', undefined, ...params);
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
    _logger.log(messageTemplate, 'ERROR', exception, ...params);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Log a critical level message<br />
   *
   * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
   * Example:<br />
   * ```typescript
   * const applicationName = 'foo';
   * const minutes = 3;
   *
   * // with placeholders
   * critical('Application {ApplicationName} shut down after {Minutes} minutes', applicationName, minutes);
   *
   * // without placeholders
   * critical('Application shut down');
   * ```
   *
   * @param messageTemplate - Message template with optional placeholders
   * @param params - Parameters to replace placeholders in message template
   */
  export function critical(messageTemplate: string, ...params: MessageParameter[]): void {
    _logger.log(messageTemplate, 'CRITICAL', undefined, ...params);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Log a critical level message with an exception<br />
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
   *   criticalException(error, 'Application {ApplicationName} shut down after {Minutes} minutes', applicationName, minutes);
   *
   *   // without placeholders
   *   criticalException(error, 'Application shut down');
   * }
   * ```
   *
   * @param exception - An error or exception
   * @param messageTemplate - Message template with optional placeholders
   * @param params - Parameters to replace placeholders in message template
   */
  export function criticalException(exception: unknown, messageTemplate: string, ...params: MessageParameter[]): void {
    _logger.log(messageTemplate, 'CRITICAL', exception, ...params);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Log a fatal level message<br />
   *
   * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
   * Example:<br />
   * ```typescript
   * const applicationName = 'foo';
   * const minutes = 3;
   *
   * // with placeholders
   * fatal('Application {ApplicationName} shut down after {Minutes} minutes', applicationName, minutes);
   *
   * // without placeholders
   * fatal('Application shut down');
   * ```
   *
   * @param messageTemplate - Message template with optional placeholders
   * @param params - Parameters to replace placeholders in message template
   */
  export function fatal(messageTemplate: string, ...params: MessageParameter[]): void {
    _logger.log(messageTemplate, 'FATAL', undefined, ...params);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Log a fatal level message with an exception<br />
   *
   * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
   * Example:<br />
   * ```typescript
   * const applicationName = 'foo';
   *
   * try {
   *   // some code that throws an error
   * } catch (error) {
   *   // with placeholders
   *   fatalException(error, 'Application {ApplicationName} terminated', applicationName);
   *
   *   // without placeholders
   *   fatalException(error, 'Application terminated');
   * }
   * ```
   *
   * @param exception - An error or exception
   * @param messageTemplate - Message template with optional placeholders
   * @param params - Parameters to replace placeholders in message template
   */
  export function fatalException(exception: unknown, messageTemplate: string, ...params: MessageParameter[]): void {
    _logger.log(messageTemplate, 'FATAL', exception, ...params);
  }
}