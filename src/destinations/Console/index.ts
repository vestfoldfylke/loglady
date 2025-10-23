import type { LogDestination } from '../../types/LogDestination.types';
import type { LogLevel, MessageObject, TrackedPromise } from '../../types/log.types';

// noinspection JSUnusedGlobalSymbols
/**
 * @internal
 * 
 * LogDestination that logs to the console<br /><br />
 * 
 * **active**: Defaults to true, can be overridden by setting environment variable **CONSOLE_ENABLED** to `false`<br />
 * **name**: 'Console'
 */
export default class ConsoleDestination implements LogDestination {
  readonly active: boolean;
  readonly name: string = 'Console';

  // @ts-ignore - This comment can be removed when _pkg is used
  private readonly _pkg: unknown;

  constructor(pkg: unknown) {
    const active: string | boolean | undefined = process.env['CONSOLE_ENABLED'];

    this._pkg = pkg;

    this.active = active === undefined
      ? true
      : String(active).trim().toLowerCase() === 'true';
  }

  log(messageObject: MessageObject, level: LogLevel): TrackedPromise {
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
      case 'CRITICAL':
      case 'FATAL':
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