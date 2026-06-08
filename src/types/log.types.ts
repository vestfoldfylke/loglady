export type BufferedDestinationEntry<T> = {
  payload: T;
  trackedPromise: TrackedPromise;
  settle: () => void;
};

export type CallingInfo = {
  functionName: string;
  fileName: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
};

export type ConsoleColors = {
  fgCyan: string;
  fgRed: string;
  fgWhite: string;
  fgYellow: string;
  reset: string;
};

export type LogLevel = "debug" | "info" | "warn" | "error" | "DEBUG" | "INFO" | "WARN" | "ERROR";

export type PrimitiveParameter = string | number | bigint | boolean | undefined | null;
export type MessageParameter = PrimitiveParameter | object | [];

/**
 * Counts `{placeholder}` occurrences in a string literal type and returns a tuple
 * with exactly that length. Placeholders prefixed with `@` (e.g. `{@User}`) accept
 * any `MessageParameter` (including objects/arrays, which get JSON-stringified at
 * runtime). Plain placeholders (e.g. `{Name}`) only accept `PrimitiveParameter`.
 *
 * Falls back to `MessageParameter[]` (variadic, no enforcement) when `T` is the
 * widened `string` type (i.e. a runtime variable whose value isn't known at compile time).
 */
export type PlaceholderParams<T extends string, Acc extends MessageParameter[] = []> = string extends T
  ? MessageParameter[]
  : T extends `${string}{${infer Name}}${infer Rest}`
    ? PlaceholderParams<Rest, [...Acc, Name extends `@${string}` ? MessageParameter : PrimitiveParameter]>
    : Acc;

export type MessageObjectProperties = {
  [key: string]: MessageParameter;
};

export type MessageObject = {
  messageTemplate: string;
  message: string;
  exception?: string | undefined;
  properties: MessageObjectProperties;
};

export type RuntimeInfo = {
  appName: string | undefined;
  version: string | undefined;
  environmentName: string | undefined;
};

export type TrackedPromise = {
  name: string;
  promise: Promise<void> | Promise<Response>;
  isSettled: boolean;
};
