import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import dts from "rollup-plugin-dts";

const input = "src/index.ts";

export default defineConfig([
  {
    input,
    external: (id) => id.startsWith("node:"),
    output: [
      {
        dir: "dist/esm",
        format: "esm",
        preserveModules: true,
        preserveModulesRoot: "src",
        sourcemap: true
      },
      {
        dir: "dist/cjs",
        format: "cjs",
        preserveModules: true,
        preserveModulesRoot: "src",
        sourcemap: true,
        exports: "auto",
        entryFileNames: "[name].cjs"
      }
    ],
    plugins: [typescript({ declaration: false, declarationMap: false })]
  },
  {
    input,
    external: (id) => id.startsWith("node:"),
    output: {
      dir: "dist/types",
      format: "esm",
      preserveModules: true,
      preserveModulesRoot: "src",
      sourcemap: true
    },
    plugins: [dts()]
  }
]);
