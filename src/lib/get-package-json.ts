import { createRequire } from 'module';
import { join } from 'path';

export function getPackageJson(): unknown {
  const require = createRequire(import.meta.url);
  const packageJsonPath = join(process.cwd(), 'package.json');

  return require(packageJsonPath);
}