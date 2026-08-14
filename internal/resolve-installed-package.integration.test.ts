import { describe, expect, test } from "vitest";

import pkg from "../package.json" with { type: "json" };
import { resolveInstalledPackage } from "./resolve-installed-package.mjs";

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

  // Regression guard, not a tight budget: this runs synchronously on every consumer's tool
  // startup (every eslint/prettier/tsdown/remark/commitlint invocation), so it must stay cheap.
  // The threshold is generous on purpose (today's real cost is under 10ms; see
  // explanation.md#why-resolve-installed-packagemjs-has-a-performance-regression-test) — it's
  // meant to catch a future change that swaps the require()/readFileSync fallback for something
  // categorically slower (a spawned process, a registry network call), not to flake on a busy CI
  // runner.
  test("resolves every one of this repo's own declared peers well within a generous budget", () => {
    const names = Object.keys(pkg.peerDependencies);

    const start = performance.now();
    for (const name of names) resolveInstalledPackage(name);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
  });
});
