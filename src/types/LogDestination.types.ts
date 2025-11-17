import type { LogLevel, MessageObject, TrackedPromise } from "./log.types";

/**
 * Interface for a log destination<br /><br />
 *
 * Implement this interface to create a custom log destination for loglady 🪵<br /><br />
 *
 * The callers package.json file will be imported and passed to the constructor of the implementing class<br /><br />
 *
 * If the destination adds any custom environment variables to control its behavior, <b><u>document them in the README.md file!</u></b><br /><br />
 *
 * Example implementation:
 * ```TypeScript
 * import type { LogDestination } from '../../types/LogDestination.types';
 * import type { LogLevel, MessageObject, TrackedPromise } from '../../types/log.types';
 * import type { MinimalPackage } from '../../types/minimal-package.types';
 *
 * import { canLogAtLevel, validateLogLevel } from '../../lib/log-level.js';
 *
 * export default class CustomDestination implements LogDestination {
 *   readonly active: boolean;
 *   readonly name: string = '%DestinationNameHere%';
 *
 *   private readonly _minLogLevel: LogLevel;
 *   // @ts-expect-error - This comment can be removed when _pkg is used
 *   private readonly _pkg: MinimalPackage;
 *
 *   constructor(pkg: MinimalPackage) {
 *     // set your own logic to determine if the destination is active based on environment variables or other criteria
 *     this.active = process.env['SOME_ENV'] !== undefined;
 *
 *     this._minLogLevel = (process.env['SOME_ENV_MIN_LOG_LEVEL'] as LogLevel) || 'ERROR';
 *     if (!validateLogLevel(this._minLogLevel)) {
 *       throw new Error(`Invalid SOME_ENV_MIN_LOG_LEVEL value: ${process.env["SOME_ENV_MIN_LOG_LEVEL"]}`);
 *     }
 *
 *     this._pkg = pkg;
 *   }
 *
 *   createPayload<T>(messageObject: MessageObject, level: LogLevel): T {
 *     return {
 *       timestamp: new Date().toISOString(),
 *       level,
 *       ...messageObject
 *     } as T;
 *   }
 *
 *   log(messageObject: MessageObject, level: LogLevel): TrackedPromise {
 *     if (!canLogAtLevel(level, this._minLogLevel)) {
 *       return {
 *         name: this.name,
 *         promise: Promise.resolve(),
 *         isSettled: true
 *       };
 *     }
 *
 *     const payload: CustomPayloadType = this.createPayload<CustomPayloadType>(messageObject, level);
 *
 *     // Custom logging logic here
 *
 *     return {
 *       name: this.name,
 *       promise: Promise.resolve(),
 *       isSettled: true
 *     };
 *   }
 * }
 * ```
 */
export interface LogDestination {
  /**
   * Indicates whether the destination is active and should receive log messages. Can be overridden by environment variables (check README)<br /><br />
   *
   * Should be set in the constructor of the implementing class based on environment variables
   * ```TypeScript
   * constructor() {
   *   // set your own logic to determine if the destination is active based on environment variables or other criteria
   *   this.active = process.env['SOME_ENV_VAR'] !== undefined;
   * }
   * ```
   */
  readonly active: boolean;

  /**
   * The name of the destination
   */
  readonly name: string;

  /**
   * Creates the log destination payload of type T from given messageObject and log level<br /><br />
   *
   * This method must be implemented in the log destination to be able to test the payload creation separately from the logging logic.<br /><br />
   *
   * Example usage:
   * ```TypeScript
   * createPayload<T>(messageObject: MessageObject, level: LogLevel): T {
   *   return {
   *     timestamp: new Date().toISOString(),
   *     level,
   *     ...messageObject
   *   } as T;
   * }
   *
   * // Usage in log method
   * const payload: CustomPayloadType = this.createPayload<CustomPayloadType>(messageObject, level);
   * ```
   *
   * @param messageObject
   * @param level
   *
   * @return Payload of type T
   */
  createPayload<T>(messageObject: MessageObject, level: LogLevel): T;

  /**
   * <h4>Logs a message object at the specified log level to a log destination</h4><br /><br />
   *
   * Remember to set the `isSettled` property to `true` when the promise is settled. <b><u>If `isSettled` is not set to true, the logger's flush function will hang indefinitely!</u></b><br /><br />
   *
   * <h3>Asynchronous logging</h3>
   * If the destination supports asynchronous logging, it should return a **TrackedPromise** that resolves when logging is complete:
   * ```TypeScript
   * const payload: CustomPayloadType = this.createPayload<CustomPayloadType>(messageObject, level);
   *
   * const logPromise = fetch(endpointUrl, {
   *   method: 'POST',
   *   headers: {
   *     'Content-Type': 'application/json'
   *   },
   *   body: JSON.stringify(payload)
   * });
   *
   * const trackedPromise: TrackedPromise = {
   *   name: this.name,
   *   promise: logPromise,
   *   isSettled: false
   * };
   *
   * logPromise.finally(() => {
   *   trackedPromise.isSettled = true;
   * });
   *
   * return trackedPromise;
   * ```
   *
   * <h3>Synchronous logging</h3>
   * If the destination does not support asynchronous logging, it should return a resolved **TrackedPromise** after logging is complete:
   * ```TypeScript
   * const payload: CustomPayloadType = this.createPayload<CustomPayloadType>(messageObject, level);
   *
   * // logging logic here
   *
   * return {
   *   name: this.name,
   *   promise: Promise.resolve(),
   *   isSettled: true
   * };
   * ```
   *
   * @param messageObject - The message object to log
   * @param level - The log level of the message
   *
   * @returns A **TrackedPromise** where `isSettled` will be `true` when the logging is complete (either successfully or with an error)
   */
  log(messageObject: MessageObject, level: LogLevel): TrackedPromise;
}
