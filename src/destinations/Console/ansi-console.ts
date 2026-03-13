import type { ConsoleColors } from "../../types/log.types";

export const colors: ConsoleColors = {
  reset: "\u001b[0m",
  fgRed: "\u001b[31m",
  fgYellow: "\u001b[33m",
  fgCyan: "\u001b[36m",
  fgWhite: "\u001b[37m"
};

export const colorDebug = (...args: string[]): void => {
  console.debug(colors.fgCyan, ...args, colors.reset);
};

export const colorInfo = (...args: string[]): void => {
  console.info(colors.fgWhite, ...args, colors.reset);
};

export const colorWarn = (...args: string[]): void => {
  console.warn(colors.fgYellow, ...args, colors.reset);
};

export const colorError = (...args: unknown[]): void => {
  console.error(colors.fgRed, ...args, colors.reset);
};
