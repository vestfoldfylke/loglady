import { readdirSync } from 'fs';

import type { Dirent } from 'node:fs';
import type { LogDestination } from '../types/LogDestination.types';
import type { LogLevel, MessageObject, MessageObjectProperties, MessageParameter, TrackedPromise } from '../types/log.types';

export class Logger {
  protected _destinations: LogDestination[] = [];
  protected _queue: TrackedPromise[];

  constructor(queue: TrackedPromise[]) {
    this._queue = queue ?? [];
    
    this.initialize();
  }
  
  // TODO: Implement a possibility to change the logConfig at any time, preserving the old config and adding new config on top

  private initialize = (): void => {
    // TODO: Get destinations config from environment variables

    const destinationFolders: Dirent[] = readdirSync(new URL('../destinations', import.meta.url), { withFileTypes: true });
    console.log(`[Logger] Loading destinations: ${destinationFolders.map(destinationFolder => destinationFolder.name).join(', ')}`);
    destinationFolders.forEach((destinationFolder: Dirent): void => {
      import(`../destinations/${destinationFolder.name}/index.js`).then((module) => {
        // TODO: Get environment variables for this destination
        const DestinationClass = module.default;

        // TODO: Pass configuration to destination constructor
        const destinationInstance: LogDestination = new DestinationClass();
        this._destinations.push(destinationInstance);
        console.log(`[Logger] Loaded destination: ${destinationInstance.name}`);
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
    console.log(`[Logger] Cleaning up queue. Current queue length: ${this._queue.length}`);

    for (let i: number = this._queue.length - 1; i >= 0; i--) {
      const name = this._queue[i]?.name;
      console.log(`[Logger] Checking promise by ${name} for cleanup. Is settled: ${this._queue[i]?.isSettled}`);
      if (this._queue[i]?.isSettled) {
        this._queue.splice(i, 1);
        console.log(`[Logger] Cleaned up settled promise by ${name} from queue. Remaining items: ${this._queue.length}`);
      }
    }

    console.log(`[Logger] Queue cleanup complete. Final queue length: ${this._queue.length}`);
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

    if (exception !== undefined) {
      messageObject.exception = exception;
    }

    this._destinations.forEach((destination: LogDestination): void => {
      if (!destination.active) {
        return;
      }

      console.log(`[Logger] Adding promise by ${destination.name} to queue. Current queue length: ${this._queue.length}`);
      this._queue.push(destination.log(messageObject, level));
      console.log(`[Logger] Added promise by ${destination.name} to queue. New queue length: ${this._queue.length}`);

      this.cleanupQueue();
    });
  };
}