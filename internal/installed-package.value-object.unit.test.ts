import { describe, expect, test } from "vitest";

import { InstalledPackage } from "./installed-package.value-object.mjs";

describe("InstalledPackage", () => {
  test("isPresent is true when constructed with a version", () => {
    expect(new InstalledPackage("eslint", "9.39.5").isPresent()).toBe(true);
  });

  test("isPresent is false for InstalledPackage.absent", () => {
    expect(InstalledPackage.absent("eslint").isPresent()).toBe(false);
  });

  test("match calls the present branch with the version when installed", () => {
    const installed = new InstalledPackage("eslint", "9.39.5");
    const result = installed.match(
      (version) => `present: ${version}`,
      () => "absent",
    );
    expect(result).toBe("present: 9.39.5");
  });

  test("match calls the absent branch when not installed", () => {
    const result = InstalledPackage.absent("eslint").match(
      (version) => `present: ${version}`,
      () => "absent",
    );
    expect(result).toBe("absent");
  });
});
