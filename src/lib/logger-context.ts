import type { LogConfig } from "../types/log-config.types";

let getContext: () => LogConfig | undefined = () => undefined;

/**
 * @internal
 *
 * Set the internal context provider
 *
 * @param provider - The internal context provider function or undefined to unset
 */
export const setInternalContextProvider = (provider: () => LogConfig | undefined) => {
  getContext = provider;
};

/**
 * @internal
 *
 * Get the internal context
 *
 * @returns The internal context or undefined if not set
 */
export const getInternalContext = (): LogConfig | undefined => {
  return getContext();
};
