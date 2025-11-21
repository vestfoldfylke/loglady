import BetterStackDestination from "../destinations/BetterStack/index.js";
import ConsoleDestination from "../destinations/Console/index.js";
import MicrosoftTeamsDestination from "../destinations/Microsoft Teams/index.js";

import type { LogDestination } from "../types/LogDestination.types";
import type {
  CallingInfo,
  LogLevel,
  MessageObject,
  MessageObjectProperties,
  MessageParameter,
  RuntimeInfo,
  TrackedPromise
} from "../types/log.types";

import type { LogConfig } from "../types/log-config.types";
import type { MinimalPackage } from "../types/minimal-package.types";

import { getPackageJson } from "./get-package-json.js";
import { getRuntimeInfo } from "./get-runtime-info.js";

export class Logger {
  protected _destinations: LogDestination[] = [];
  protected _queue: TrackedPromise[];
  protected _runtimeInfo: RuntimeInfo;

  constructor(queue: TrackedPromise[]) {
    this._queue = queue ?? [];

    const pkg: MinimalPackage = getPackageJson();
    this._runtimeInfo = getRuntimeInfo(pkg);

    this._destinations.push(...[new ConsoleDestination(pkg), new BetterStackDestination(pkg), new MicrosoftTeamsDestination(pkg)]);
  }

  private createPropertiesObject = (logConfig: LogConfig): MessageObjectProperties => {
    const properties: MessageObjectProperties = {};

    if (this._runtimeInfo.appName !== undefined) {
      properties["AppName"] = this._runtimeInfo.appName;
    }

    if (this._runtimeInfo.version !== undefined) {
      properties["Version"] = this._runtimeInfo.version;
    }

    if (this._runtimeInfo.environmentName !== undefined) {
      properties["EnvironmentName"] = this._runtimeInfo.environmentName;
    }

    // Add logConfig properties in PascalCase to properties
    Object.entries(logConfig).forEach(([key, value]: [string, string | undefined]): void => {
      if (!value) {
        return;
      }

      const pascalCase: string = key.charAt(0).toUpperCase() + key.slice(1);
      properties[pascalCase] = value;
    });

    const callingInfo: CallingInfo | undefined = this.getCallingInfo();
    if (callingInfo !== undefined) {
      properties["FunctionName"] = callingInfo.functionName;
      properties["FileName"] = callingInfo.fileName;
      properties["FilePath"] = callingInfo.filePath;
      properties["LineNumber"] = callingInfo.lineNumber;
      properties["ColumnNumber"] = callingInfo.columnNumber;
    }

    return properties;
  };

  private getParameterValue = (param: string, value: MessageParameter): string => {
    if (value === undefined || value === null) {
      return "NULL";
    }

    if (param.startsWith("@") && (typeof value === "object" || Array.isArray(value))) {
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
    const stackSplit = error.stack?.split("\n").filter((line) => !line.includes("node_modules")) ?? [];
    if (stackSplit.length < 2) {
      return undefined;
    }

    const line = stackSplit[1];
    if (line === undefined) {
      return undefined;
    }

    const match = line.match(/\s*at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) || line.match(/\s*at\s+(.*):(\d+):(\d+)/);
    if (!match) {
      return undefined;
    }

    const functionName: string = match.length >= 5 ? (match[1] as string) : "<anonymous>";

    const filePath: string = match.length >= 5 ? (match[2] as string) : (match[1] as string);

    const fileName: string =
      filePath
        ?.replace(process.cwd(), "")
        .replace(/(^\/+)|(^\\+)/, "")
        .replace("file:///", "") ?? undefined;

    const lineNumber = match.length >= 5 ? parseInt(match[3] as string, 10) : parseInt(match[2] as string, 10);

    const columnNumber = match.length >= 5 ? parseInt(match[4] as string, 10) : parseInt(match[3] as string, 10);

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
  public log = (
    logConfig: LogConfig,
    messageTemplate: string,
    level: LogLevel,
    exception: undefined | unknown,
    ...params: MessageParameter[]
  ): void => {
    const messageParameters: RegExpMatchArray | [] = messageTemplate.match(/{[a-zæøåA-ZÆØÅ0-9]+}|{@[a-zæøåA-ZÆØÅ0-9]+}/g) ?? [];
    if (!Array.isArray(params) || params.length !== messageParameters.length) {
      throw new Error(
        `[${new Date().toISOString()}] - Not enough parameters provided for ${level} messageTemplate. Expected ${messageParameters.length}, got ${params.length}`
      );
    }

    let message: string = messageTemplate;
    const properties: MessageObjectProperties = this.createPropertiesObject(logConfig);

    messageParameters.forEach((param: string, index: number): void => {
      const placeholderParam: string = param.replace(/[{}]/g, "");
      const cleanParam: string = placeholderParam.replace(/@/g, "");
      const paramValue: MessageParameter = params[index] ?? null;

      const messageValue: string = this.getParameterValue(placeholderParam, paramValue);

      message = message.replace(param, messageValue.toString());
      properties[cleanParam] = paramValue;
    });

    if (logConfig.prefix) {
      message = `${logConfig.prefix} - ${message}`;
    }

    if (logConfig.suffix) {
      message = `${message} - ${logConfig.suffix}`;
    }

    const messageObject: MessageObject = {
      messageTemplate,
      message,
      properties
    };

    if (exception !== undefined && exception !== null && Object.hasOwn(exception, "stack")) {
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
