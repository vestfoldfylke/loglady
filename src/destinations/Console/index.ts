import type { LogDestination } from '../../types/LogDestination.types';
import type { LogLevel, MessageObject, TrackedPromise } from '../../types/log.types';

// noinspection JSUnusedGlobalSymbols
/**
 * @internal
 * 
 * LogDestination that logs to the console<br /><br />
 * 
 * **active**: Defaults to true, can be overridden by environment variables (check README)<br />
 * **name**: 'Console'
 */
export default class ConsoleDestination implements LogDestination {
  active: boolean;
  name: string = 'Console';

  constructor(active?: boolean | undefined) {
    this.active = active ?? true;
  }

  log(messageObject: MessageObject, level: LogLevel): TrackedPromise {
    // TODO: Log out only message string from messageObject
    switch (level) {
      case 'DEBUG':
        console.debug(messageObject);
        break;
      case 'INFO':
        console.info(messageObject);
        break;
      case 'WARN':
        console.warn(messageObject);
        break;
      case 'ERROR':
      case 'CRITICAL':
      case 'FATAL':
        console.error(messageObject);
        break;
      default:
        console.log(messageObject);
    }

    return {
      promise: Promise.resolve(),
      name: this.name,
      isSettled: true
    };
  }
}