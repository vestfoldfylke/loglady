import type { LogLevel, MessageObject, MessageObjectProperties, MessageParameter } from './types/log.types';

const queue: Promise<void>[] = [];

const getParameterValue = (param: string, value: MessageParameter): string => {
  if (param.startsWith('@') && (typeof value === 'object' || Array.isArray(value))) {
    return JSON.stringify(value);
  }

  return value.toString();
};

/**
 * Called by level logger functions to log a message to active destinations
 */
const log = (messageTemplate: string, level: LogLevel, ...params: MessageParameter[]): void => {
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

    const messageValue: string = getParameterValue(placeholderParam, paramValue);

    message = message.replace(param, messageValue.toString());
    properties[cleanParam] = paramValue;
  });

  const messageObject: MessageObject = {
    messageTemplate,
    message,
    properties
  };
  
  // Here you would send the messageObject to your logging destinations
  console.log(level, messageObject);
};

// noinspection JSUnusedGlobalSymbols
/**
 * Should be called before application exits or session is finished, to ensure all log messages have been processed (successfully or not)
 */
export async function flush(): Promise<void> {
  await Promise.allSettled(queue);
  queue.length = 0;
}

// noinspection JSUnusedGlobalSymbols
/**
 * Log a debug level message<br />
 * 
 * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
 * Example:<br />
 * ```typescript
 * const username = 'john_doe';
 * const ipAddress = '127.0.0.1';
 * 
 * // with placeholders
 * debug('Username {Username} has logged in from IP {IPAddress}', username, ipAddress);
 * 
 * // without placeholders
 * debug('Application has started');
 * ```
 * 
 * @param messageTemplate - Message template with optional placeholders
 * @param params - Parameters to replace placeholders in message template
 */
export function debug(messageTemplate: string, ...params: MessageParameter[]): void {
  log(messageTemplate, 'DEBUG', ...params);
}

/**
 * Log an info level message<br />
 * 
 * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
 * Example:<br />
 * ```typescript
 * const username = 'john_doe';
 * const ipAddress = '127.0.0.1';
 * 
 * // with placeholders
 * info('Username {Username} has logged in from IP {IPAddress}', username, ipAddress);
 * 
 * // without placeholders
 * info('Application has started');
 * ```
 *
 * @param messageTemplate - Message template with optional placeholders
 * @param params - Parameters to replace placeholders in message template
 */
export function info(messageTemplate: string, ...params: MessageParameter[]): void {
  log(messageTemplate, 'INFO', ...params);
}

/**
 * Log a warning level message<br />
 * 
 * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
 * Example:<br />
 * ```typescript
 * const applicationName = 'foo';
 * const minutes = 3;
 * 
 * // with placeholders
 * warn('Application {ApplicationName} considers shutting down in {Minutes} minutes', applicationName, minutes);
 * 
 * // without placeholders
 * warn('Application considers shutting down');
 * ```
 *
 * @param messageTemplate - Message template with optional placeholders
 * @param params - Parameters to replace placeholders in message template
 */
export function warn(messageTemplate: string, ...params: MessageParameter[]): void {
  log(messageTemplate, 'WARN', ...params);
}

// noinspection JSUnusedGlobalSymbols
/**
 * Log an error level message<br />
 * 
 * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
 * Example:<br />
 * ```typescript
 * const applicationName = 'foo';
 * const minutes = 3;
 * 
 * // with placeholders
 * error('Application {ApplicationName} shut down after {Minutes} minutes', applicationName, minutes);
 * 
 * // without placeholders
 * error('Application shut down');
 * ```
 *
 * @param messageTemplate - Message template with optional placeholders
 * @param params - Parameters to replace placeholders in message template
 */
export function error(messageTemplate: string, ...params: MessageParameter[]): void {
  log(messageTemplate, 'ERROR', ...params);
}

// noinspection JSUnusedGlobalSymbols
/**
 * Log a critical level message<br />
 * 
 * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
 * Example:<br />
 * ```typescript
 * const applicationName = 'foo';
 * 
 * // with placeholders
 * critical('Application {ApplicationName} terminated', applicationName);
 * 
 * // without placeholders
 * critical('Application terminated');
 * ```
 *
 * @param messageTemplate - Message template with optional placeholders
 * @param params - Parameters to replace placeholders in message template
 */
export function critical(messageTemplate: string, ...params: MessageParameter[]): void {
  log(messageTemplate, 'CRITICAL', ...params);
}

// noinspection JSUnusedGlobalSymbols
/**
 * Log a fatal level message<br />
 * 
 * <b>If placeholders are used in the message template, equal amount of parameters must be provided</b><br /><br />
 * Example:<br />
 * ```typescript
 * const applicationName = 'foo';
 * 
 * // with placeholders
 * fatal('Application {ApplicationName} terminated', applicationName);
 * 
 * // without placeholders
 * fatal('Application terminated');
 * ```
 *
 * @param messageTemplate - Message template with optional placeholders
 * @param params - Parameters to replace placeholders in message template
 */
export function fatal(messageTemplate: string, ...params: MessageParameter[]): void {
  log(messageTemplate, 'FATAL', ...params);
}