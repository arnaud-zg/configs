import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { subpathPeerRegistry } from "./internal/subpath-peer-registry.mjs";
import pkg from "./package.json" with { type: "json" };

const root = import.meta.dirname;

const requiredPeersBySubpath: [string, string[]][] = subpathPeerRegistry
  .subpaths()
  .map((subpath) => [subpath, subpathPeerRegistry.peerNames(subpath)]);

describe("a developer importing a subpath", () => {
  // ./tsdown resolves to built dist/ output, not a checked-in file; see tsdown/base.integration.test.ts.
  const sourceExports = Object.entries(pkg.exports).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );

  test.each(sourceExports)("can resolve %s", (_subpath, target) => {
    expect(existsSync(path.join(root, target))).toBe(true);
  });

  test("./tsdown resolves to built dist/ output, not raw source", () => {
    expect(pkg.exports["./tsdown"]).toEqual({
      types: "./dist/base.d.ts",
      default: "./dist/base.js",
    });
  });
});

describe("a developer following the install instructions", () => {
  test.each(requiredPeersBySubpath)(
    "installing the documented peers for %s is enough, nothing extra is silently required",
    (subpath, peers) => {
      expect(pkg.exports).toHaveProperty(subpath);
      for (const peer of peers) {
        expect(pkg.peerDependencies, `missing peerDependency "${peer}"`).toHaveProperty(peer);
        expect(
          (pkg.peerDependenciesMeta as Record<string, { optional?: boolean }>)[peer]?.optional,
          `peerDependency "${peer}" should be optional`,
        ).toBe(true);
      }
    },
  );
});
