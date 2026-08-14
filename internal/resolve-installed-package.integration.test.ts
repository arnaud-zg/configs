import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import pkg from "../package.json" with { type: "json" };
import { resolveInstalledPackage } from "./resolve-installed-package.mjs";

const root = import.meta.dirname;

describe("resolveInstalledPackage", () => {
  test("finds a real installed package's version via require resolution", () => {
    const installed = resolveInstalledPackage("typescript");
    expect(installed.isPresent()).toBe(true);
    expect(
      installed.match(
        (version) => version,
        () => undefined,
      ),
    ).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("is absent for a package that isn't installed anywhere", () => {
    expect(resolveInstalledPackage("@arnaud-zg/does-not-exist-fixture").isPresent()).toBe(false);
  });

  // Regression: remark-cli ships "exports": [], blocking require() resolution of its own
  // package.json even though the file is readable on disk. The walk fallback exists for this.
  test("falls back to a directory walk for a package whose exports field blocks package.json", () => {
    expect(resolveInstalledPackage("remark-cli").isPresent()).toBe(true);
  });

  // Regression guard: this runs synchronously on every consumer's tool startup (every
  // eslint/prettier/tsdown/remark/commitlint invocation), so it must stay cheap. The threshold
  // still has headroom on top of measured reality (consistently 4-5ms locally across repeated
  // runs; see explanation.md#why-resolve-installed-packagemjs-has-a-performance-regression-test),
  // but it's tight enough to catch a future change that swaps the require()/readFileSync fallback
  // for something categorically slower (a spawned process, a registry network call) without
  // chasing milliseconds so hard it flakes on a busy CI runner.
  test("resolves every one of this repo's own declared peers well within budget", () => {
    const names = Object.keys(pkg.peerDependencies);

    const start = performance.now();
    for (const name of names) resolveInstalledPackage(name);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});

// resolveInstalledPackage's cost scales with directory depth between its own location and wherever
// the target package's node_modules folder sits, not with the consuming repo's file count or lines
// of code: nothing here ever reads anything but package.json files on that one path. A monorepo
// with a huge codebase but a normal node_modules layout costs the same as the test above; what
// actually stresses this function is directory nesting (e.g. a package many workspace layers deep
// in a large Bazel/Nx-style monorepo), so that's the one variable this fixture exercises.
describe("resolveInstalledPackage from deep inside a huge monorepo's directory tree", () => {
  // Far deeper than any real npm/pnpm/yarn install nests node_modules: measured up to 150 levels by
  // hand while writing this test, at roughly 0.025ms/level, ~4ms total (see
  // explanation.md#why-resolve-installed-packagemjs-has-a-performance-regression-test). 100 is
  // already an unrealistic worst case; the threshold below still leaves ~10x headroom on top of it.
  const DEPTH = 100;

  let tmpDir: string | undefined;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  });

  function buildDeeplyNestedFixture(): { entryFile: string; targetName: string } {
    const dir = mkdtempSync(path.join(os.tmpdir(), "resolve-installed-package-depth-"));
    tmpDir = dir;

    let deepest = dir;
    for (let level = 0; level < DEPTH; level++) deepest = path.join(deepest, `${level}`);
    const internalDir = path.join(deepest, "internal");
    mkdirSync(internalDir, { recursive: true });
    cpSync(
      path.join(root, "resolve-installed-package.mjs"),
      path.join(internalDir, "resolve-installed-package.mjs"),
    );
    cpSync(
      path.join(root, "installed-package.value-object.mjs"),
      path.join(internalDir, "installed-package.value-object.mjs"),
    );

    // exports: [] blocks require()'s fast path, same as the real remark-cli regression this file
    // already covers above, forcing the manual directory-walk fallback across the full DEPTH-level
    // chain before it succeeds at the workspace root — the exact code path this test is about.
    const targetName = "deeply-nested-peer-fixture";
    const targetDir = path.join(dir, "node_modules", targetName);
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(
      path.join(targetDir, "package.json"),
      JSON.stringify({ name: targetName, version: "1.0.0", exports: [] }),
    );

    return { entryFile: path.join(internalDir, "resolve-installed-package.mjs"), targetName };
  }

  test("still resolves in low milliseconds, not the cost of a spawned process or network call", async () => {
    const { entryFile, targetName } = buildDeeplyNestedFixture();
    const deepModule = (await import(
      entryFile
    )) as typeof import("./resolve-installed-package.mjs");

    const start = performance.now();
    const installed = deepModule.resolveInstalledPackage(targetName);
    const elapsed = performance.now() - start;

    expect(installed.isPresent()).toBe(true);
    expect(elapsed).toBeLessThan(50);
  });
});
