import { readdirSync } from 'fs';

import { getPackageJson } from './get-package-json.js';

import type { Dirent } from 'node:fs';
import type { LogDestination } from '../types/LogDestination.types';
import type { LogLevel, MessageObject, MessageObjectProperties, MessageParameter, TrackedPromise } from '../types/log.types';

export class Logger {
  protected _destinations: LogDestination[] = [];
  protected _queue: TrackedPromise[];

  constructor(queue: TrackedPromise[]) {
    this._queue = queue ?? [];

    this.initialize()
      .catch((error: unknown): void => {
        console.error(`[${new Date().toISOString()}] - Error initializing Logger:`, error);
      });
  }

  private initialize = async (): Promise<void> => {
    const pkg: unknown = await getPackageJson();
    // TODO: import.meta.url only works in EMS
    const destinationFolders: Dirent[] = readdirSync(new URL('../destinations', import.meta.url), { withFileTypes: true });

    destinationFolders.forEach((destinationFolder: Dirent): void => {
      import(`../destinations/${destinationFolder.name}/index.js`).then((module) => {
        const DestinationClass = module.default;
        const destinationInstance: LogDestination = new DestinationClass(pkg);
        this._destinations.push(destinationInstance);
      });
    });
  };

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