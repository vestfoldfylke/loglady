export type ConsolePayload =
  | [timestamp: string, levelString: string, contextId: string, message: string]
  | [timestamp: string, levelString: string, message: string];
