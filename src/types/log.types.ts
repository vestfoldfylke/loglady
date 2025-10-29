export type CallingInfo = {
  functionName: string
  fileName: string
  filePath: string
  lineNumber: number
  columnNumber: number
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type MessageParameter = string | number | bigint | boolean | object | [];

export type MessageObjectProperties = {
  [key: string]: MessageParameter
};

export type MessageObject = {
  messageTemplate: string
  message: string
  exception?: string | undefined
  properties: MessageObjectProperties
};

export type RuntimeInfo = {
  appName: string | undefined
  version: string | undefined
  environmentName: string | undefined
}

export type TrackedPromise = {
  name: string
  promise: Promise<void> | Promise<Response>
  isSettled: boolean
};