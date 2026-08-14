import { describe, expect, test } from "vitest";

import { PackageRange } from "./package-range.value-object.mjs";

describe("PackageRange", () => {
  test("isSatisfiedBy is true for a version within the range", () => {
    expect(new PackageRange("^9.39.4").isSatisfiedBy("9.39.5")).toBe(true);
  });

  test("isSatisfiedBy is false for a version outside the range", () => {
    expect(new PackageRange("^9.39.4").isSatisfiedBy("8.57.0")).toBe(false);
  });

  test("toString returns the original range string", () => {
    expect(new PackageRange("^9.39.4").toString()).toBe("^9.39.4");
  });

  test("interpolates as its range string in a template literal", () => {
    const range = new PackageRange("^9.39.4");
    // This is exactly the point of the test: PackageRange defines toString() so it interpolates
    // cleanly, the way internal/peer-requirement.mjs relies on.
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    expect(`needs ${range}`).toBe("needs ^9.39.4");
  });
});
