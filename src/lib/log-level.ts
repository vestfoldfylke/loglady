import type { LogLevel } from "../types/log.types";

const levelMapper = {
  DEBUG: 0,
  debug: 0,
  INFO: 1,
  info: 1,
  WARN: 2,
  warn: 2,
  ERROR: 3,
  error: 3
};

/**
 * @internal
 *
 * Determines if a message can be logged at the specified minimum log level.
 *
 * @param messageLogLevel - The log level of the message.
 * @param minimumLogLevel - The minimum log level required to log the message.
 *
 * @returns True if the message can be logged; otherwise, false.
 */
export function canLogAtLevel(messageLogLevel: LogLevel, minimumLogLevel: LogLevel): boolean {
  const messageLevelValue: number = levelMapper[messageLogLevel as keyof typeof levelMapper];
  if (messageLevelValue === undefined) {
    throw new Error(`Invalid message log level: ${messageLogLevel}`);
  }

  const minimumLogLevelValue: number = levelMapper[minimumLogLevel as keyof typeof levelMapper];
  if (minimumLogLevelValue === undefined) {
    throw new Error(`Invalid minimum log level: ${minimumLogLevel}`);
  }

  return messageLevelValue >= minimumLogLevelValue;
}

/**
 * @internal
 *
 * Validates if the provided log level is a recognized log level.
 *
 * @param logLevel - The log level to validate.
 *
 * @returns True if the log level is valid; otherwise, false.
 */
export function validateLogLevel(logLevel: LogLevel): boolean {
  try {
    const logLevelValue: number = levelMapper[logLevel as keyof typeof levelMapper];
    return logLevelValue >= 0;
  } catch {
    return false;
  }
}
