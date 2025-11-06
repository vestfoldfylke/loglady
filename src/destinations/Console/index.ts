import { canLogAtLevel } from "../../lib/log-level.js";

import type { LogDestination } from "../../types/LogDestination.types";
import type { LogLevel, MessageObject, TrackedPromise } from "../../types/log.types";
import type { MinimalPackage } from "../../types/minimal-package.types";

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
  readonly name: string = "Console";

  private readonly _minLogLevel: LogLevel;
  // @ts-expect-error - This comment can be removed when _pkg is used
  private readonly _pkg: MinimalPackage;

  constructor(pkg: MinimalPackage) {
    const active: string | boolean | undefined = process.env["CONSOLE_ENABLED"];

    this._minLogLevel = (process.env["CONSOLE_MIN_LOG_LEVEL"] as LogLevel) || "DEBUG";
    this._pkg = pkg;

    this.active = active === undefined ? true : String(active).trim().toLowerCase() === "true";
  }

  log(messageObject: MessageObject, level: LogLevel): TrackedPromise {
    if (!canLogAtLevel(level, this._minLogLevel)) {
      return {
        name: this.name,
        promise: Promise.resolve(),
        isSettled: true
      };
    }

    const levelString: string = `[${level}]`;

    const params = [
      new Date().toISOString(),
      levelString,
      messageObject.properties["ContextId"] ? `[${messageObject.properties["ContextId"]}]` : undefined,
      messageObject.message
    ].filter((part) => part !== undefined);

    switch (level) {
      case "DEBUG":
        console.debug(...params);
        break;
      case "INFO":
        console.info(...params);
        break;
      case "WARN":
        console.warn(...params);
        break;
      case "ERROR":
        if (messageObject.exception !== undefined) {
          console.error(...params, "--->", messageObject.exception);
          break;
        }

        console.error(...params);
        break;
      default:
        console.log(...params);
    }

    return {
      promise: Promise.resolve(),
      name: this.name,
      isSettled: true
    };
  }
}
