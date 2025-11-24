const reset: string = "\u001b[0m";

const fgRed: string = "\u001b[31m";
const fgYellow: string = "\u001b[33m";
const fgCyan: string = "\u001b[36m";
const fgWhite: string = "\u001b[37m";

export const colorDebug = (...args: string[]): void => {
  console.debug(fgCyan, ...args, reset);
};

export const colorInfo = (...args: string[]): void => {
  console.info(fgWhite, ...args, reset);
};

export const colorWarn = (...args: string[]): void => {
  console.warn(fgYellow, ...args, reset);
};

export const colorError = (...args: string[]): void => {
  console.error(fgRed, ...args, reset);
};
