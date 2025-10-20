export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'FATAL';

export type MessageParameter = string | number | bigint | boolean | object | [];

export type MessageObjectProperties = {
  [key: string]: MessageParameter
};

export type MessageObject = {
  messageTemplate: string
  message: string
  properties: MessageObjectProperties
  appName?: string
  version?: string
  environmentName?: string
};