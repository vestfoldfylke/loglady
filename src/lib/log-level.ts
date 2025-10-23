import type { LogLevel } from '../types/log.types';

const levelMapper = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

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