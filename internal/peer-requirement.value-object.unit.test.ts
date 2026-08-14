import { describe, expect, test } from "vitest";

import { InstalledPackage } from "./installed-package.value-object.mjs";
import { PeerRequirement } from "./peer-requirement.value-object.mjs";

describe("PeerRequirement", () => {
  test("is satisfied when the given installed version matches the range", () => {
    const requirement = new PeerRequirement("eslint", "^9.39.4");
    const installed = new InstalledPackage("eslint", "9.39.5");
    expect(requirement.checkAgainst(installed)).toBeUndefined();
  });

  test("describes a missing peer, naming the required range", () => {
    const requirement = new PeerRequirement("eslint", "^9.39.4");
    expect(requirement.checkAgainst(InstalledPackage.absent("eslint"))).toBe(
      "  ✗ eslint  not installed (needs ^9.39.4)",
    );
  });

  test("describes an installed peer whose version doesn't satisfy the range", () => {
    const requirement = new PeerRequirement("eslint", "^9.39.4");
    const installed = new InstalledPackage("eslint", "8.57.0");
    expect(requirement.checkAgainst(installed)).toBe("  ✗ eslint  8.57.0 installed, needs ^9.39.4");
  });

  test("formats itself as a pnpm install specifier", () => {
    expect(new PeerRequirement("eslint", "^9.39.4").toInstallSpecifier()).toBe("eslint@^9.39.4");
  });
});
