import type { LogDestination } from '../../types/LogDestination.types';
import type { LogLevel, MessageObject, TrackedPromise } from '../../types/log.types';

// noinspection JSUnusedGlobalSymbols
/**
 * @internal
 * 
 * LogDestination that logs to BetterStack<br /><br />
 * 
 * **active**: `true` only when **BETTERSTACK_URL** and **BETTERSTACK_TOKEN** are specified as environment variables<br />
 * **name**: 'BetterStack'
 */
export default class BetterStackDestination implements LogDestination {
  readonly active: boolean;
  readonly name: string = 'BetterStack';

  private readonly _endpoint: string | undefined;
  private readonly _token: string | undefined;

  // @ts-ignore - This comment can be removed when _pkg is used
  private readonly _pkg: unknown;

  constructor(pkg: unknown) {
    this._endpoint = process.env['BETTERSTACK_URL'];
    this._token = process.env['BETTERSTACK_TOKEN'];

    this._pkg = pkg;

    this.active = this._endpoint !== undefined && this._token !== undefined;
  }

  private createMessage = (messageObject: MessageObject, level: LogLevel): unknown => {
    return {
      dt: new Date().toISOString(),
      level,
      ...messageObject
    };
  };

  log(messageObject: MessageObject, level: LogLevel): TrackedPromise {
    const betterStackMessage: unknown = this.createMessage(messageObject, level);

    const promise: Promise<Response> = fetch(this._endpoint as string, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this._token}`,
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