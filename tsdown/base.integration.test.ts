import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const tsdownBase = path.join(root, "tsdown", "base");
const tsdownBin = path.join(root, "node_modules/.bin/tsdown");

let tmpDir: string | undefined;

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
});

// Sets up a fixture library and actually builds it with `defineLibraryConfig`, the way a
// developer's own tsdown.config.ts would use it, then reports what landed in dist/.
function buildFixture(extraConfig: string): { dir: string; distFiles: string[] } {
  const dir = mkdtempSync(path.join(os.tmpdir(), "tsdown-test-"));
  tmpDir = dir;
  mkdirSync(path.join(dir, "src"));
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module" }));
  writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { module: "esnext", moduleResolution: "bundler", target: "es2022" },
      include: ["src"],
    }),
  );
  writeFileSync(path.join(dir, "src", "index.ts"), "export const answer = 42;\n");
  writeFileSync(
    path.join(dir, "tsdown.config.ts"),
    `import { defineLibraryConfig } from ${JSON.stringify(tsdownBase)};\n\nexport default defineLibraryConfig({ entry: ["src/index.ts"], tsconfig: "tsconfig.json", exports: false${extraConfig} });\n`,
  );
  execFileSync(tsdownBin, { cwd: dir, stdio: "pipe" });
  const distDir = path.join(dir, "dist");
  return { dir, distFiles: existsSync(distDir) ? readdirSync(distDir) : [] };
}

describe("a developer building a library with defineLibraryConfig", () => {
  test("gets ESM output and a declaration file by default", () => {
    const { dir, distFiles } = buildFixture("");
    expect(distFiles).toContain("index.js");
    expect(distFiles).toContain("index.d.ts");
    const built = readFileSync(path.join(dir, "dist", "index.js"), "utf8");
    expect(built).toMatch(/export/); // ESM, not CommonJS require/module.exports
  });

  test("an explicit dts: false override actually suppresses the declaration file", () => {
    const { distFiles } = buildFixture(", dts: false");
    expect(distFiles).toContain("index.js");
    expect(distFiles).not.toContain("index.d.ts");
  });
});

describe("tsdown build (integration)", () => {
  test("builds tsdown/base.ts via the repo's own tsdown.config.ts within a generous time budget", () => {
    // The time budget is a coarse smoke alarm, not a benchmark: it catches a gross regression
    // (e.g. a misconfigured tsconfig making the isolated dts build scan far more than intended)
    // without pretending to precisely measure build performance.
    const distDir = path.join(root, "dist");
    rmSync(distDir, { recursive: true, force: true });
    try {
      const start = performance.now();
      execFileSync(tsdownBin, { cwd: root, stdio: "pipe" });
      expect(performance.now() - start).toBeLessThan(10_000);
      expect(existsSync(path.join(distDir, "base.js"))).toBe(true);
      expect(existsSync(path.join(distDir, "base.d.ts"))).toBe(true);
    } finally {
      rmSync(distDir, { recursive: true, force: true });
    }
  });
});
