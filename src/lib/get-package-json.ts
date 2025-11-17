import { createRequire } from "node:module";
import { join } from "node:path";

import type { MinimalPackage } from "../types/minimal-package.types";

/**
 * @internal
 *
 * Reads and returns the contents of the package.json file as a MinimalPackage object.
 *
 * @returns {MinimalPackage} The contents of the package.json file.
 */
export function getPackageJson(): MinimalPackage {
  const require = createRequire(import.meta.url);
  const packageJsonPath = join(process.cwd(), "package.json");

  return require(packageJsonPath);
}
