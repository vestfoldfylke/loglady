import ConsoleDestination from '../destinations/Console/index.js';
import BetterStackDestination from '../destinations/BetterStack/index.js';
import MicrosoftTeamsDestination from '../destinations/Microsoft Teams/index.js';

import { getPackageJson } from './get-package-json.js';

import type { LogDestination } from '../types/LogDestination.types';
import type { CallingInfo, LogLevel, MessageObject, MessageObjectProperties, MessageParameter, TrackedPromise } from '../types/log.types';

export class Logger {
  protected _destinations: LogDestination[] = [];
  protected _queue: TrackedPromise[];

  constructor(queue: TrackedPromise[]) {
    this._queue = queue ?? [];

    const pkg: unknown = getPackageJson();
    this._destinations.push(...[
      new ConsoleDestination(pkg),
      new BetterStackDestination(pkg),
      new MicrosoftTeamsDestination(pkg)
    ]);
  }

  private getParameterValue = (param: string, value: MessageParameter): string => {
    if (param.startsWith('@') && (typeof value === 'object' || Array.isArray(value))) {
      return JSON.stringify(value);
    }

    return value.toString();
  };
  
  private cleanupQueue = (): void => {
    for (let i: number = this._queue.length - 1; i >= 0; i--) {
      if (this._queue[i]?.isSettled) {
        this._queue.splice(i, 1);
      }
    }
  };
  
  private getCallingInfo = (): CallingInfo | undefined => {
    const error = new Error();
    const stackLines = error.stack?.split('\n').slice(4, 5) ?? [];
    if (stackLines.length === 0) {
      return undefined;
    }

    const line = stackLines[0];
    if (line === undefined) {
      return undefined;
    }

    const match = line.match(/\s*at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) || line.match(/\s*at\s+(.*):(\d+):(\d+)/);
    if (!match) {
      return undefined;
    }

    const functionName: string = match.length >= 5
      ? match[1] as string
      : '<anonymous>';

    const filePath: string = match.length >= 5
      ? match[2] as string
      : match[1] as string;

    const fileName: string = filePath?.replace(process.cwd(), '').replace(/(^\/+)|(^\\+)/, '').replace('file:///', '') ?? undefined;

    const lineNumber = match.length >= 5
      ? parseInt(match[3] as string, 10)
      : parseInt(match[2] as string, 10);

    const columnNumber = match.length >= 5
      ? parseInt(match[4] as string, 10)
      : parseInt(match[3] as string, 10);

    return {
      functionName,
      fileName,
      filePath,
      lineNumber,
      columnNumber
    };
  };

  /**
   * @internal
   * 
   * Called by level logger functions to log a message to active destinations
   */
  public log = (messageTemplate: string, level: LogLevel, exception: undefined | unknown, ...params: MessageParameter[]): void => {
    const messageParameters: RegExpMatchArray | [] = messageTemplate.match(/{[a-zæøåA-ZÆØÅ0-9]+}|{@[a-zæøåA-ZÆØÅ0-9]+}/g) ?? [];
    if (!Array.isArray(params) || params.length !== messageParameters.length) {
      throw new Error(`[${new Date().toISOString()}] - Not enough parameters provided for ${level} messageTemplate. Expected ${messageParameters.length}, got ${params.length}`);
    }

    let message: string = messageTemplate;
    const properties: MessageObjectProperties = {};

    messageParameters.forEach((param: string, index: number): void => {
      const placeholderParam: string = param.replace(/[{}]/g, '');
      const cleanParam: string = placeholderParam.replace(/@/g, '');
      const paramValue: MessageParameter | undefined = params[index];
      if (paramValue === undefined) {
        throw new Error(`[${new Date().toISOString()}] - Parameter at index ${index} is undefined for ${level} messageTemplate`);
      }

      const messageValue: string = this.getParameterValue(placeholderParam, paramValue);

      message = message.replace(param, messageValue.toString());
      properties[cleanParam] = paramValue;
    });

    const messageObject: MessageObject = {
      messageTemplate,
      message,
      properties
    };

    if (exception !== undefined && exception !== null && Object.prototype.hasOwnProperty.call(exception, 'stack')) {
      messageObject.exception = (exception as Error).stack;
    }

    const callingInfo: CallingInfo | undefined = this.getCallingInfo();
    if (callingInfo !== undefined) {
      messageObject.properties['CallingInfo'] = callingInfo;
    }

    this._destinations.forEach((destination: LogDestination): void => {
      if (!destination.active) {
        return;
      }

      this._queue.push(destination.log(messageObject, level));
    });

    if (this._queue.length > 0) {
      this.cleanupQueue();
    }
  };
}