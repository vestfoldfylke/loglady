import type { LogLevel, MessageObject, TrackedPromise } from './log.types';

/**
 * Interface for a log destination<br /><br />
 * 
 * Implement this interface to create a custom log destination for the loglady 🪵<br /><br />
 * 
 * The callers package.json file will be imported and passed to the constructor of the implementing class<br /><br />
 * 
 * Example implementation:
 * ```typescript *
 * export default class CustomDestination implements LogDestination {
 *   readonly active: boolean;
 *   readonly name: string = '%DestinationNameHere%';
 *   
 *   // @ts-ignore - This comment can be removed when _pkg is used
 *   private readonly _pkg: unknown;
 * 
 *   constructor(pkg: unknown) {
 *     this.active = process.env['SOME_ENV'] !== undefined;
 *     
 *     this._pkg = pkg;
 *   }
 * 
 *   log(messageObject: MessageObject, level: LogLevel): TrackedPromise {
 *     // Custom logging logic here
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
   * ```typescript
   * constructor() {
   *   // determine active status based on environment variable(s)
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
   * <h4>Logs a message object at the specified log level to a log destination</h4><br /><br />
   * 
   * Remember to set the `isSettled` property to `true` when the promise is settled. <b><u>If `isSettled` is not set to true, the logger's flush function will hang indefinitely!</u></b><br /><br />
   *
   * <h3>Asynchronous logging</h3>
   * If the destination supports asynchronous logging, it should return a **TrackedPromise** that resolves when logging is complete:
   * ```typescript
   * const logPromise = fetch(endpointUrl, {
   *   method: 'POST',
   *   headers: {
   *     'Content-Type': 'application/json'
   *   },
   *   body: JSON.stringify(messageObject)
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
   * ```typescript
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