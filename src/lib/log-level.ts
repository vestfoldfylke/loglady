import type { LogLevel } from '../types/log.types';

const levelMapper = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

export function canLogAtLevel(messageLevel: LogLevel, minimumLogLevel: LogLevel): boolean {
  const messageLevelValue: number = levelMapper[messageLevel as keyof typeof levelMapper];
  const minimumLogLevelValue: number = levelMapper[minimumLogLevel as keyof typeof levelMapper];

  return messageLevelValue >= minimumLogLevelValue;
}