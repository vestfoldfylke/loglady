import { Logger } from './lib/logger.js';

import type { MessageParameter, TrackedPromise } from './types/log.types';

const _queue: TrackedPromise[] = [];

const _logger = new Logger(_queue);

// TODO: export functions under a namespace 'logger'?

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
  console.log('[Logger] Debug log called:', _queue.length);
  _logger.log(messageTemplate, 'DEBUG', undefined, ...params);
  console.log('[Logger] Debug log processed:', _queue.length);
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
  console.log('[Logger] Info log called:', _queue.length);
  _logger.log(messageTemplate, 'INFO', undefined, ...params);
  console.log('[Logger] Info log processed:', _queue.length);
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
  console.log('[Logger] Warn log called:', _queue.length);
  _logger.log(messageTemplate, 'WARN', undefined, ...params);
  console.log('[Logger] Warn log processed:', _queue.length);
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
export function error(messageTemplate: string, ...params: MessageParameter[]): void;

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
 *   error(error, 'Application {ApplicationName} shut down after {Minutes} minutes', applicationName, minutes);
 *
 *   // without placeholders
 *   error(error, 'Application shut down');
 * }
 * ```
 *
 * @param exception - An error or exception
 * @param messageTemplate - Message template with optional placeholders
 * @param params - Parameters to replace placeholders in message template
 */
export function error(exception: unknown, messageTemplate: string, ...params: MessageParameter[]): void;

// noinspection JSUnusedGlobalSymbols
export function error(arg1: unknown, arg2: unknown, ...params: MessageParameter[]): void {
  console.log('[Logger] Error log called:', _queue.length);
  
  if (typeof arg1 === 'string') {
    _logger.log(arg1, 'ERROR', undefined, ...params);
    console.log('[Logger] Error log processed:', _queue.length);
    return;
  }

  if (typeof arg2 === 'string') {
    _logger.log(arg2, 'ERROR', arg1, ...params);
    console.log('[Logger] Error log processed:', _queue.length);
    return;
  }

  throw new Error(`[${new Date().toISOString()}] - Invalid arguments provided to error log`);
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
export function critical(messageTemplate: string, ...params: MessageParameter[]): void;

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
 *   critical(error, 'Application {ApplicationName} shut down after {Minutes} minutes', applicationName, minutes);
 *
 *   // without placeholders
 *   critical(error, 'Application shut down');
 * }
 * ```
 *
 * @param exception - An error or exception
 * @param messageTemplate - Message template with optional placeholders
 * @param params - Parameters to replace placeholders in message template
 */
export function critical(exception: unknown, messageTemplate: string, ...params: MessageParameter[]): void;

// noinspection JSUnusedGlobalSymbols
export function critical(arg1: unknown, arg2: unknown, ...params: MessageParameter[]): void {
  console.log('[Logger] Critical log called:', _queue.length);

  if (typeof arg1 === 'string') {
    _logger.log(arg1, 'CRITICAL', undefined, ...params);
    console.log('[Logger] Critical log processed:', _queue.length);
    return;
  }

  if (typeof arg2 === 'string') {
    _logger.log(arg2, 'CRITICAL', arg1, ...params);
    console.log('[Logger] Critical log processed:', _queue.length);
    return;
  }

  throw new Error(`[${new Date().toISOString()}] - Invalid arguments provided to critical log`);
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
export function fatal(messageTemplate: string, ...params: MessageParameter[]): void;

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
 *   fatal(error, 'Application {ApplicationName} terminated', applicationName);
 *
 *   // without placeholders
 *   fatal(error, 'Application terminated');
 * }
 * ```
 *
 * @param exception - An error or exception
 * @param messageTemplate - Message template with optional placeholders
 * @param params - Parameters to replace placeholders in message template
 */
export function fatal(exception: unknown, messageTemplate: string, ...params: MessageParameter[]): void;

// noinspection JSUnusedGlobalSymbols
export function fatal(arg1: unknown, arg2: unknown, ...params: MessageParameter[]): void {
  console.log('[Logger] FATAL log called:', _queue.length);

  if (typeof arg1 === 'string') {
    _logger.log(arg1, 'FATAL', undefined, ...params);
    console.log('[Logger] FATAL log processed:', _queue.length);
    return;
  }

  if (typeof arg2 === 'string') {
    _logger.log(arg2, 'FATAL', arg1, ...params);
    console.log('[Logger] FATAL log processed:', _queue.length);
    return;
  }

  throw new Error(`[${new Date().toISOString()}] - Invalid arguments provided to fatal log`);
}