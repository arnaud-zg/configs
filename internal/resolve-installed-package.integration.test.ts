import { describe, expect, test } from "vitest";

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
});
