import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { MinimalPackage } from "../types/minimal-package.types.js";

/**
 * @internal
 *
 * Reads and returns the contents of the package.json file as a MinimalPackage object.
 *
 * @returns {MinimalPackage} The contents of the package.json file.
 */
export function getPackageJson(): MinimalPackage {
  const packageJsonPath = join(process.cwd(), "package.json");
  return JSON.parse(readFileSync(packageJsonPath, "utf-8")) as MinimalPackage;
}
