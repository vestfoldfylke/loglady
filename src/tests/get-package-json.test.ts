import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { getPackageJson } from "../lib/get-package-json.js";
import type { MinimalPackage } from "../types/minimal-package.types.js";

const withTempPackageJson = (pkg: unknown, fn: () => void) => {
  const tmpDir = mkdtempSync(join(tmpdir(), "loglady-test-"));
  writeFileSync(join(tmpDir, "package.json"), JSON.stringify(pkg));
  const originalCwd = process.cwd();
  process.chdir(tmpDir);
  try {
    fn();
  } finally {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true });
  }
};

describe("getPackageJson", () => {
  describe("real package.json", () => {
    it("returns the actual package name and version", () => {
      const result = getPackageJson();
      assert.strictEqual(result.name, "@vestfoldfylke/loglady");
      assert.ok(result.version, "version should be present");
      assert.match(result.version as string, /^\d+\.\d+\.\d+/);
    });

    it("returns repository as an object with a github url", () => {
      const result = getPackageJson();
      assert.ok(typeof result.repository === "object" && result.repository !== null);
      assert.ok((result.repository as { url: string }).url.includes("github.com/vestfoldfylke/loglady"));
    });
  });

  describe("temp package.json", () => {
    it("returns all MinimalPackage fields from file", () => {
      const pkg: MinimalPackage = { name: "my-app", version: "2.3.4", repository: { url: "https://example.com" } };
      withTempPackageJson(pkg, () => {
        assert.deepStrictEqual(getPackageJson(), pkg);
      });
    });

    it("handles package.json with only name", () => {
      withTempPackageJson({ name: "minimal" }, () => {
        assert.deepStrictEqual(getPackageJson(), { name: "minimal" });
      });
    });

    it("handles repository as a plain string", () => {
      const pkg: MinimalPackage = { name: "repo-string", repository: "git+https://github.com/org/repo.git" };
      withTempPackageJson(pkg, () => {
        assert.deepStrictEqual(getPackageJson(), pkg);
      });
    });

    it("handles empty package.json", () => {
      withTempPackageJson({}, () => {
        assert.deepStrictEqual(getPackageJson(), {});
      });
    });

    it("throws when package.json does not exist", () => {
      const enoentDir = mkdtempSync(join(tmpdir(), "loglady-test-"));
      const cwdBeforeEnoent = process.cwd();
      process.chdir(enoentDir);
      try {
        assert.throws(() => getPackageJson(), /ENOENT/);
      } finally {
        process.chdir(cwdBeforeEnoent);
        rmSync(enoentDir, { recursive: true });
      }
    });

    it("throws SyntaxError when package.json contains invalid JSON", () => {
      const invalidJsonDir = mkdtempSync(join(tmpdir(), "loglady-test-"));
      writeFileSync(join(invalidJsonDir, "package.json"), "not valid json{{{");
      const cwdBeforeInvalidJson = process.cwd();
      process.chdir(invalidJsonDir);
      try {
        assert.throws(() => getPackageJson(), SyntaxError);
      } finally {
        process.chdir(cwdBeforeInvalidJson);
        rmSync(invalidJsonDir, { recursive: true });
      }
    });
  });
});
