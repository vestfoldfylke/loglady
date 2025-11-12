import { Logger } from "./lib/logger.js";
import { getInternalContext, setInternalContextProvider } from "./lib/logger-context.js";

import type { MessageParameter, TrackedPromise } from "./types/log.types";
import type { LogConfig } from "./types/log-config.types";

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
   * <h3>Only applicable when <u>not</u> using an <i>AsyncLocalStorage</i> through `setContextProvider`</h3>
   *
   * Configure optional logging settings<br />
   * Can be called multiple times to update specific settings<br /><br />
   *
   * Example:<br />
   * ```typescript
   * logConfig({
   *   contextId: '12345-abcde-67890-abcde',
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
    const logConfig: LogConfig = getInternalContext() ?? _logConfig;
    _logger.log(logConfig, messageTemplate, "DEBUG", undefined, ...params);
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
    const logConfig: LogConfig = getInternalContext() ?? _logConfig;
    _logger.log(logConfig, messageTemplate, "INFO", undefined, ...params);
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
    const logConfig: LogConfig = getInternalContext() ?? _logConfig;
    _logger.log(logConfig, messageTemplate, "WARN", undefined, ...params);
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
    const logConfig: LogConfig = getInternalContext() ?? _logConfig;
    _logger.log(logConfig, messageTemplate, "ERROR", undefined, ...params);
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
    const logConfig: LogConfig = getInternalContext() ?? _logConfig;
    _logger.log(logConfig, messageTemplate, "ERROR", exception, ...params);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * <h3>Only applicable when running the async request chain through an <i>AsyncLocalStorage</i></h3>
   *
   * Sets the context provider function to retrieve logging context from<br /><br />
   *
   * Add the following to a new file:<br />
   * ```typescript
   * import { AsyncLocalStorage } from "node:async_hooks";
   *
   * import type { LogConfig } from "@vestfoldfylke/loglady/dist/types/log-config.types";
   *
   * import { logger } from "@vestfoldfylke/loglady";
   *
   * const asyncLocalStorage = new AsyncLocalStorage<LogConfig>();
   *
   * export async function runInContext<T>(logConfig: LogConfig, callback: () => Promise<T>): Promise<T> {
   *   logger.setContextProvider((): LogConfig => asyncLocalStorage.getStore());
   *   return asyncLocalStorage.run(logConfig, callback);
   * }
   *
   * export function updateContext(logConfig: LogConfig): void {
   *   const _logConfig: LogConfig = asyncLocalStorage.getStore();
   *   if (_logConfig) {
   *     Object.assign(_logConfig, logConfig);
   *   }
   * }
   * ```<br /><br />
   *
   * And call `runInContext` (preferable as soon as possible after request initialization)<br />
   * ```typescript
   * import { runInContext } from './file-path-created-from-file-above.js';
   *
   * const context: LogConfig = { contextId: '12345-abcde-67890-abcde' };
   *
   * runInContext<HttpResponseInit>(context, async (): Promise<HttpResponseInit> => {
   *   // Your code here will have access to the logging context
   *   logger.info('This log will include the context ID from AsyncLocalStorage');
   *
   *   ....
   * });
   * ```
   *
   * @param provider
   */
  //export function setContextProvider(provider: LogContextProvider): void {
  export function setContextProvider(provider: () => LogConfig | undefined): void {
    setInternalContextProvider(provider);
  }
}
