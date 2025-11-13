import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";

function fixExtensionsPlugin({ from = ".js'", to = ".cjs'" } = {}) {
  return {
    name: "fix-extensions",
    // rollup hooks automatically called by Rollup during the build process (not imported, just defined and called)
    renderChunk(code, chunk) {
      if (!code.includes(".js'")) {
        return code;
      }

      return code.replaceAll(from, to);
    }
  };
}

function getAllTsFiles(dir) {
  const files = readdirSync(dir);

  return files.flatMap((file) => {
    const fullPath = path.join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return getAllTsFiles(fullPath);
    }

    if (file.endsWith(".ts")) {
      return fullPath;
    }

    return [];
  });
}

function importMetaUrlPlugin({ format }) {
  return {
    name: "import-meta-url-handler",
    // rollup hooks automatically called by Rollup during the build process (not imported, just defined and called)
    resolveImportMeta(property, { moduleId, chunkId, format: outFormat }) {
      if (property !== "url") {
        return null;
      }

      // For ESM: keep native import.meta.url
      if (outFormat === "es") {
        return "import.meta.url";
      }

      // For CJS: convert to __filename
      if (outFormat === "cjs") {
        return "__filename";
      }

      // For Browser (IIFE/UMD)
      if (outFormat === "iife" || outFormat === "umd") {
        // Use document.currentScript or new URL hack
        return `(typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || new URL('${path.basename(moduleId)}', import.meta.url).href`;
      }
    }
  };
}

const inputFiles = getAllTsFiles("./src");

export default [
  // ESM build
  {
    input: inputFiles,
    output: {
      dir: "dist/esm",
      format: "es",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src"
    },
    plugins: [
      importMetaUrlPlugin({ format: "es" }),
      resolve(),
      commonjs(),
      esbuild({ include: /\.ts$/, minify: false, target: "ES2020", tsconfig: "tsconfig.esm.json" })
    ]
  },
  // CommonJS build
  {
    input: inputFiles,
    output: {
      dir: "dist/cjs",
      entryFileNames: "[name].cjs",
      chunkFileNames: "[name].cjs",
      format: "cjs",
      sourcemap: true,
      preserveModules: true, // Keep the module structure (many small files)
      preserveModulesRoot: "src",
      exports: "auto"
    },
    plugins: [
      importMetaUrlPlugin({ format: "cjs" }),
      resolve(),
      commonjs(),
      esbuild({ include: /\.ts$/, minify: false, target: "ES2020", tsconfig: "tsconfig.cjs.json" }),
      fixExtensionsPlugin({ from: ".js'", to: ".cjs'" })
    ]
  },
  // browser UMD build
  {
    input: "src/index.ts",
    output: {
      file: "dist/browser/index.js",
      format: "umd",
      name: "Loglady 🪵",
      sourcemap: true
    },
    plugins: [
      importMetaUrlPlugin({ format: "umd" }),
      resolve({ browser: true }),
      commonjs(),
      esbuild({ include: /\.ts$/, minify: true, target: "ES2020", tsconfig: "tsconfig.umd.json" }),
      terser()
    ]
  },
  // type declarations
  {
    input: "./src/index.ts",
    output: {
      file: "./dist/index.d.ts",
      format: "es"
    },
    plugins: [dts()]
  }
];
