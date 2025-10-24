import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  target: 'es2020',
  minify: true
});