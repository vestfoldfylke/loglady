import { isNodeEnvironment } from './environment-checks.js';
/*import { createRequire } from 'module';
import { join } from 'path';*/

export async function getPackageJson(): Promise<unknown> {
  if (!isNodeEnvironment()) {
    console.warn('getPackageJson can only be used in a Node.js environment.');
    return undefined;
  }

  try {
    const createRequire = (await import('module')).createRequire;
    const { join } = await import('path');

    const packageJsonPath = join(process.cwd(), 'package.json');
    console.log('Loading package.json from:', packageJsonPath);

    return createRequire(packageJsonPath);
  } catch (error) {
    console.error('Error loading package.json:', error);
  }
  
  return undefined;
  /*const require = createRequire(import.meta.url);
  const packageJsonPath = join(process.cwd(), 'package.json');

  return require(packageJsonPath);*/
}