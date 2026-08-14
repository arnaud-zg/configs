import { describe, expect, test } from "vitest";

import { PeerRequirementList } from "./peer-requirement-list.mjs";
import { subpathPeerRegistry } from "./subpath-peer-registry.mjs";

describe("subpathPeerRegistry", () => {
  test("subpaths lists every subpath that declares peers", () => {
    expect(subpathPeerRegistry.subpaths()).toContain("./eslint");
    expect(subpathPeerRegistry.subpaths()).toContain("./commitlint");
  });

  test("peerNames returns the declared peer names for a subpath", () => {
    expect(subpathPeerRegistry.peerNames("./commitlint")).toEqual([
      "@commitlint/cli",
      "@commitlint/config-conventional",
    ]);
  });

  test("requirementsFor builds a PeerRequirementList from the given peerDependencies", () => {
    const list = subpathPeerRegistry.requirementsFor("./commitlint", {
      "@commitlint/cli": "^21.2.1",
      "@commitlint/config-conventional": "^21.2.0",
    });
    expect(list).toBeInstanceOf(PeerRequirementList);
    expect(list.installCommand()).toBe(
      "pnpm add -D @commitlint/cli@^21.2.1 @commitlint/config-conventional@^21.2.0",
    );
  });

  test("requirementsFor throws if a declared peer has no range in the given peerDependencies", () => {
    expect(() =>
      subpathPeerRegistry.requirementsFor("./commitlint", { "@commitlint/cli": "^21.2.1" }),
    ).toThrow(/@commitlint\/config-conventional.*has no range in peerDependencies/);
  });
});
