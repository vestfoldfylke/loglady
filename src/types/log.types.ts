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
  exception?: undefined | unknown
  properties: MessageObjectProperties
  appName?: string
  version?: string
  environmentName?: string
};

export type TrackedPromise = {
  name: string
  promise: Promise<void> | Promise<Response>
  isSettled: boolean
};