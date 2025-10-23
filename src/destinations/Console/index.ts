import type { LogDestination } from '../../types/LogDestination.types';
import type { LogLevel, MessageObject, TrackedPromise } from '../../types/log.types';

import { canLogAtLevel } from '../../lib/log-level.js';

// noinspection JSUnusedGlobalSymbols
/**
 * @internal
 * 
 * LogDestination that logs to the console<br /><br />
 * 
 * **active**: Defaults to true, can be overridden by setting environment variable **CONSOLE_ENABLED** to `false`<br />
 * **name**: 'Console'<br /><br >
 *
 * Minimum log level defaults to `DEBUG` but can be customized by specifying the **CONSOLE_MIN_LOG_LEVEL** environment variable
 */
export default class ConsoleDestination implements LogDestination {
  readonly active: boolean;
  readonly name: string = 'Console';

  private readonly _minLogLevel: LogLevel;
  // @ts-ignore - This comment can be removed when _pkg is used
  private readonly _pkg: unknown;

  constructor(pkg: unknown) {
    const active: string | boolean | undefined = process.env['CONSOLE_ENABLED'];

    this._minLogLevel = (process.env['CONSOLE_MIN_LOG_LEVEL'] as LogLevel) || 'DEBUG';
    this._pkg = pkg;

    this.active = active === undefined
      ? true
      : String(active).trim().toLowerCase() === 'true';
  }

  log(messageObject: MessageObject, level: LogLevel): TrackedPromise {
    if (!canLogAtLevel(level, this._minLogLevel)) {
      return {
        name: this.name,
        promise: Promise.resolve(),
        isSettled: true
      };
    }

    switch (level) {
      case 'DEBUG':
        console.debug(new Date().toISOString(), messageObject.message);
        break;
      case 'INFO':
        console.info(new Date().toISOString(), messageObject.message);
        break;
      case 'WARN':
        console.warn(new Date().toISOString(), messageObject.message);
        break;
      case 'ERROR':
        if (messageObject.exception !== undefined) {
          console.error(new Date().toISOString(), messageObject.message, '--->', messageObject.exception);
          break;
        }

        console.error(new Date().toISOString(), messageObject.message);
        break;
      default:
        console.log(new Date().toISOString(), messageObject.message);
    }

    return {
      promise: Promise.resolve(),
      name: this.name,
      isSettled: true
    };
  }
}