import { afterEach, describe, expect, test, vi } from "vitest";

import { MissingPeerDependenciesError } from "./missing-peer-dependencies-error.mjs";
import { peerCheckToggleEnvVar } from "./peer-check-toggle.mjs";
import { PeerRequirementList } from "./peer-requirement-list.mjs";
import { PeerRequirement } from "./peer-requirement.value-object.mjs";

afterEach(() => {
  delete process.env[peerCheckToggleEnvVar];
});

describe("PeerRequirementList", () => {
  test("problems is empty when every requirement is satisfied", () => {
    const list = new PeerRequirementList([new PeerRequirement("typescript", "^6.0.3")]);
    expect(list.problems()).toEqual([]);
  });

  test("problems collects a description per unsatisfied requirement, satisfied ones excluded", () => {
    const list = new PeerRequirementList([
      new PeerRequirement("typescript", "^6.0.3"),
      new PeerRequirement("@arnaud-zg/does-not-exist-fixture", "^1.0.0"),
    ]);
    expect(list.problems()).toEqual([
      "  ✗ @arnaud-zg/does-not-exist-fixture  not installed (needs ^1.0.0)",
    ]);
  });

  test("installCommand lists every requirement, not just the unsatisfied ones", () => {
    const list = new PeerRequirementList([
      new PeerRequirement("typescript", "^6.0.3"),
      new PeerRequirement("@arnaud-zg/does-not-exist-fixture", "^1.0.0"),
    ]);
    expect(list.installCommand()).toBe(
      "pnpm add -D typescript@^6.0.3 @arnaud-zg/does-not-exist-fixture@^1.0.0",
    );
  });

  test("assertSatisfied does nothing when every requirement is satisfied", () => {
    const list = new PeerRequirementList([new PeerRequirement("typescript", "^6.0.3")]);
    expect(() => list.assertSatisfied("@arnaud-zg/configs/test")).not.toThrow();
  });

  test("assertSatisfied throws a MissingPeerDependenciesError naming the subpath", () => {
    const list = new PeerRequirementList([
      new PeerRequirement("@arnaud-zg/does-not-exist-fixture", "^1.0.0"),
    ]);
    expect(() => list.assertSatisfied("@arnaud-zg/configs/test")).toThrow(
      MissingPeerDependenciesError,
    );
  });

  test("assertSatisfied skips validation and warns when the escape hatch env var is set", () => {
    process.env[peerCheckToggleEnvVar] = "1";
    const list = new PeerRequirementList([
      new PeerRequirement("@arnaud-zg/does-not-exist-fixture", "^1.0.0"),
    ]);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => list.assertSatisfied("@arnaud-zg/configs/test")).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      `@arnaud-zg/configs/test: peer checks skipped (${peerCheckToggleEnvVar} is set)`,
    );

    warnSpy.mockRestore();
  });
});
