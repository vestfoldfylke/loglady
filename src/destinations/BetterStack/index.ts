import { colors } from "../../lib/ansi-console.js";
import { canLogAtLevel, validateLogLevel } from "../../lib/log-level.js";
import type { BetterStackPayload } from "../../types/destinations/betterstack.types.js";
import type { LogDestination } from "../../types/LogDestination.types.js";
import type { BufferedDestinationEntry, LogLevel, MessageObject, TrackedPromise } from "../../types/log.types.js";
import type { MinimalPackage } from "../../types/minimal-package.types.js";

// noinspection JSUnusedGlobalSymbols
/**
 * @internal
 *
 * LogDestination that logs to BetterStack<br /><br />
 *
 * **active**: `true` only when **BETTERSTACK_URL** and **BETTERSTACK_TOKEN** are specified as environment variables<br />
 * **name**: 'BetterStack'<br /><br >
 *
 * Minimum log level defaults to `INFO` but can be customized by specifying the **BETTERSTACK_MIN_LOG_LEVEL** environment variable<br /><br />
 *
 * Log entries are buffered and sent in batches to reduce the number of HTTP requests.
 * A batch is dispatched when it reaches **BETTERSTACK_BATCH_SIZE** entries (default: 100)
 * or after **BETTERSTACK_BATCH_INTERVAL_MS** milliseconds (default: 500), whichever comes first.
 */
export default class BetterStackDestination implements LogDestination {
  readonly active: boolean;
  readonly name: string = "BetterStack";

  private readonly _endpoint: string | undefined;
  private readonly _token: string | undefined;

  private readonly _minLogLevel: LogLevel;
  // @ts-expect-error - This comment can be removed when _pkg is used
  private readonly _pkg: MinimalPackage;

  private readonly _batchSize: number;
  private readonly _batchIntervalMs: number;

  private _buffer: BufferedDestinationEntry<BetterStackPayload>[] = [];
  private _batchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(pkg: MinimalPackage) {
    this._endpoint = process.env["BETTERSTACK_URL"];
    this._token = process.env["BETTERSTACK_TOKEN"];

    this._minLogLevel = (process.env["BETTERSTACK_MIN_LOG_LEVEL"] as LogLevel) || "INFO";
    if (!validateLogLevel(this._minLogLevel)) {
      throw new Error(`Invalid BETTERSTACK_MIN_LOG_LEVEL value: ${process.env["BETTERSTACK_MIN_LOG_LEVEL"]}`);
    }

    this._batchSize = Number(process.env["BETTERSTACK_BATCH_SIZE"] ?? 100);
    this._batchIntervalMs = Number(process.env["BETTERSTACK_BATCH_INTERVAL_MS"] ?? 500);

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

    const payload: BetterStackPayload = this.createPayload<BetterStackPayload>(messageObject, level);

    let settle!: () => void;
    const promise = new Promise<void>((resolve) => {
      settle = resolve;
    });

    const trackedPromise: TrackedPromise = {
      name: this.name,
      promise,
      isSettled: false
    };

    this._buffer.push({ payload, trackedPromise, settle });

    if (this._buffer.length >= this._batchSize) {
      this._sendBatch();
    } else if (this._batchTimer === null) {
      this._batchTimer = setTimeout(() => this._sendBatch(), this._batchIntervalMs);
    }

    return trackedPromise;
  }

  flush(): void {
    this._sendBatch();
  }

  private _sendBatch(): void {
    if (this._batchTimer !== null) {
      clearTimeout(this._batchTimer);
      this._batchTimer = null;
    }

    if (this._buffer.length === 0) {
      return;
    }

    const batch: BufferedDestinationEntry<BetterStackPayload>[] = this._buffer.splice(0);

    fetch(this._endpoint as string, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this._token}`
      },
      body: JSON.stringify(batch.map((entry) => entry.payload))
    })
      .catch((error: unknown) =>
        console.error(`${colors.fgRed}Failed to log batch of ${batch.length} message(s) to ${this.name} --->${colors.reset}`, error)
      )
      .finally(() => {
        for (const entry of batch) {
          entry.trackedPromise.isSettled = true;
          entry.settle();
        }
      });
  }
}
