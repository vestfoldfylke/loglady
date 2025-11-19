import type { RuntimeInfo } from "../types/log.types";
import type { MinimalPackage } from "../types/minimal-package.types";

/**
 * @internal
 *
 * Get runtime information from environment variables and package.json
 *
 * @param pkg - Minimal package information
 *
 * @returns Runtime information including app name, version, and environment name
 */
export function getRuntimeInfo(pkg: MinimalPackage): RuntimeInfo {
  const appNameEnv: string | undefined = process.env["APP_NAME"];
  const environmentNameEnv: string | undefined = process.env["NODE_ENV"];

  return {
    appName: appNameEnv ?? pkg?.name ?? undefined,
    version: pkg?.version ?? undefined,
    environmentName: environmentNameEnv ?? "production"
  };
}
