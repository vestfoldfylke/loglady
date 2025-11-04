import { createRequire } from "node:module";
import { join } from "node:path";

import type { MinimalPackage } from "../types/minimal-package.types";

export function getPackageJson(): MinimalPackage {
  const require = createRequire(import.meta.url);
  const packageJsonPath = join(process.cwd(), "package.json");

  return require(packageJsonPath);
}
