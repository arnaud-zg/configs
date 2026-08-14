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

  // Regression guard: runs on every consumer's tool startup, so it must stay cheap (see
  // explanation.md#why-resolve-installed-packagemjs-has-a-performance-regression-test).
  test("resolves every one of this repo's own declared peers well within budget", () => {
    const names = Object.keys(pkg.peerDependencies);

    const start = performance.now();
    for (const name of names) resolveInstalledPackage(name);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});

// Cost scales with directory depth to node_modules, not repo size (see
// explanation.md#why-theres-a-second-guard-for-a-huge-deeply-nested-monorepo).
describe("resolveInstalledPackage from deep inside a huge monorepo's directory tree", () => {
  // Deeper than any real install nests node_modules; see explanation.md linked above.
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

    // exports: [] forces the walk fallback, same as remark-cli above.
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
