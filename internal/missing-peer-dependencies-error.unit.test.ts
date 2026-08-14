import { describe, expect, test } from "vitest";

import { MissingPeerDependenciesError } from "./missing-peer-dependencies-error.mjs";

// A hand-built ProblemReport, not a real PeerRequirementList: this file tests only what
// MissingPeerDependenciesError itself does with whatever answers its two questions, in complete
// isolation from how those answers get computed elsewhere.
const fakeReport = {
  problems: () => ["  ✗ some-peer  not installed (needs ^1.0.0)"],
  installCommand: () => "pnpm add -D some-peer@^1.0.0",
};

describe("MissingPeerDependenciesError", () => {
  test("is a real Error with a descriptive name", () => {
    const error = new MissingPeerDependenciesError("@arnaud-zg/configs/test", fakeReport);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MissingPeerDependenciesError");
  });

  test("exposes the subpath and problems as structured properties, not just a formatted string", () => {
    const error = new MissingPeerDependenciesError("@arnaud-zg/configs/test", fakeReport);
    expect(error.subpath).toBe("@arnaud-zg/configs/test");
    expect(error.problems).toEqual(["  ✗ some-peer  not installed (needs ^1.0.0)"]);
  });

  test("message names the subpath, every problem, and the install command", () => {
    const error = new MissingPeerDependenciesError("@arnaud-zg/configs/test", fakeReport);
    expect(error.message).toBe(
      [
        "@arnaud-zg/configs/test is missing required peer dependencies:",
        "  ✗ some-peer  not installed (needs ^1.0.0)",
        "",
        "  pnpm add -D some-peer@^1.0.0",
      ].join("\n"),
    );
  });
});
