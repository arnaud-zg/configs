import { describe, expect, test } from "vitest";

import { caretRangeIsSatisfiedBy } from "./caret-range.mjs";

describe("caretRangeIsSatisfiedBy", () => {
  describe("ordinary major (^1.2.3): only the major digit is fixed", () => {
    test.each([
      ["1.2.3", true],
      ["1.2.4", true],
      ["1.9.9", true],
      ["1.2.2", false],
      ["2.0.0", false],
      ["0.9.9", false],
    ])("%s -> %s", (version, expected) => {
      expect(caretRangeIsSatisfiedBy("^1.2.3", version)).toBe(expected);
    });
  });

  describe("zero major (^0.21.10): tsdown's real declared range, only minor+patch move", () => {
    test.each([
      ["0.21.10", true],
      ["0.21.99", true],
      ["0.21.9", false],
      ["0.22.0", false],
      ["1.0.0", false],
    ])("%s -> %s", (version, expected) => {
      expect(caretRangeIsSatisfiedBy("^0.21.10", version)).toBe(expected);
    });
  });

  describe("zero major and minor (^0.0.3): only an exact patch match", () => {
    test.each([
      ["0.0.3", true],
      ["0.0.4", false],
      ["0.0.2", false],
      ["0.1.0", false],
    ])("%s -> %s", (version, expected) => {
      expect(caretRangeIsSatisfiedBy("^0.0.3", version)).toBe(expected);
    });
  });

  test("ignores a pre-release/build suffix on the installed version", () => {
    expect(caretRangeIsSatisfiedBy("^1.2.3", "1.2.4-beta.1")).toBe(true);
  });

  test("throws on a range that isn't a plain ^X.Y.Z caret range", () => {
    expect(() => caretRangeIsSatisfiedBy(">=1.2.3", "1.2.3")).toThrow(/unsupported range/);
    expect(() => caretRangeIsSatisfiedBy("~1.2.3", "1.2.3")).toThrow(/unsupported range/);
    expect(() => caretRangeIsSatisfiedBy("1.2.3", "1.2.3")).toThrow(/unsupported range/);
  });

  test("is false for a version string that isn't a leading X.Y.Z", () => {
    expect(caretRangeIsSatisfiedBy("^1.2.3", "not-a-version")).toBe(false);
  });
});
