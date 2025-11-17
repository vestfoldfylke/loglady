import { canLogAtLevel, validateLogLevel } from "../../lib/log-level.js";

import type { BetterStackPayload } from "../../types/destinations/betterstack.types";
import type { LogDestination } from "../../types/LogDestination.types";
import type { LogLevel, MessageObject, TrackedPromise } from "../../types/log.types";
import type { MinimalPackage } from "../../types/minimal-package.types";

// noinspection JSUnusedGlobalSymbols
/**
 * @internal
 *
 * LogDestination that logs to BetterStack<br /><br />
 *
 * **active**: `true` only when **BETTERSTACK_URL** and **BETTERSTACK_TOKEN** are specified as environment variables<br />
 * **name**: 'BetterStack'<br /><br >
 *
 * Minimum log level defaults to `INFO` but can be customized by specifying the **BETTERSTACK_MIN_LOG_LEVEL** environment variable
 */
export default class BetterStackDestination implements LogDestination {
  readonly active: boolean;
  readonly name: string = "BetterStack";

  private readonly _endpoint: string | undefined;
  private readonly _token: string | undefined;

  private readonly _minLogLevel: LogLevel;
  // @ts-expect-error - This comment can be removed when _pkg is used
  private readonly _pkg: MinimalPackage;

  constructor(pkg: MinimalPackage) {
    this._endpoint = process.env["BETTERSTACK_URL"];
    this._token = process.env["BETTERSTACK_TOKEN"];

    this._minLogLevel = (process.env["BETTERSTACK_MIN_LOG_LEVEL"] as LogLevel) || "INFO";
    if (!validateLogLevel(this._minLogLevel)) {
      throw new Error(`Invalid BETTERSTACK_MIN_LOG_LEVEL value: ${process.env["BETTERSTACK_MIN_LOG_LEVEL"]}`);
    }

    this._pkg = pkg;

    this.active = this._endpoint !== undefined && this._token !== undefined;
  }

  createPayload<T>(messageObject: MessageObject, level: LogLevel): T {
    return {
      dt: new Date().toISOString(),
      level,
      ...messageObject
    } as T;
  }

  log(messageObject: MessageObject, level: LogLevel): TrackedPromise {
    if (!canLogAtLevel(level, this._minLogLevel)) {
      return {
        name: this.name,
        promise: Promise.resolve(),
        isSettled: true
      };
    }

    const betterStackMessage: BetterStackPayload = this.createPayload<BetterStackPayload>(messageObject, level);

    const promise: Promise<Response> = fetch(this._endpoint as string, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this._token}`
      },
      body: JSON.stringify(betterStackMessage)
    });

    const trackedPromise: TrackedPromise = {
      name: this.name,
      promise,
      isSettled: false
    };

    promise.finally((): void => {
      trackedPromise.isSettled = true;
    });

    return trackedPromise;
  }
}
