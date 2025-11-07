import type { LogLevel, MessageObject } from "../log.types";

export type BetterStackProperties = {
  dt: string;
  level: LogLevel;
};

export type BetterStackPayload = BetterStackProperties & MessageObject;
