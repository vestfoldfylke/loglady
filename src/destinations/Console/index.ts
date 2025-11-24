import { canLogAtLevel, validateLogLevel } from "../../lib/log-level.js";

import type { ConsolePayload } from "../../types/destinations/console.types";
import type { LogDestination } from "../../types/LogDestination.types";
import type { LogLevel, MessageObject, TrackedPromise } from "../../types/log.types";
import type { MinimalPackage } from "../../types/minimal-package.types";

import { colorDebug, colorError, colorInfo, colorWarn } from "./ansi-console.js";

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
    if (!validateLogLevel(this._minLogLevel)) {
      throw new Error(`Invalid CONSOLE_MIN_LOG_LEVEL value: ${process.env["CONSOLE_MIN_LOG_LEVEL"]}`);
    }

    this._pkg = pkg;

    this.active = active === undefined ? true : String(active).trim().toLowerCase() === "true";
  }

  createPayload<T>(messageObject: MessageObject, level: LogLevel): T {
    return [
      new Date().toISOString(),
      `[${level}]`,
      messageObject.properties["ContextId"] ? `[${messageObject.properties["ContextId"]}]` : undefined,
      messageObject.message
    ].filter((part) => part !== undefined) as T;
  }

  log(messageObject: MessageObject, level: LogLevel): TrackedPromise {
    if (!canLogAtLevel(level, this._minLogLevel)) {
      return {
        name: this.name,
        promise: Promise.resolve(),
        isSettled: true
      };
    }

    const payload: ConsolePayload = this.createPayload<ConsolePayload>(messageObject, level);

    switch (level) {
      case "DEBUG":
        colorDebug(...payload);
        break;
      case "INFO":
        colorInfo(...payload);
        break;
      case "WARN":
        colorWarn(...payload);
        break;
      case "ERROR":
        if (messageObject.exception !== undefined) {
          colorError(...payload, "--->", messageObject.exception);
          break;
        }

        colorError(...payload);
        break;
      default:
        colorInfo(...payload);
    }

    return {
      promise: Promise.resolve(),
      name: this.name,
      isSettled: true
    };
  }
}
