import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import pkg from "../package.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");

// Peers actually required at runtime by each subpath. Mirrors what a developer following the
// docs would install: only the peers for the subpath they picked, nothing else.
const requiredPeersBySubpath: Record<string, string[]> = {
  "./eslint": ["eslint", "@eslint/js", "typescript-eslint", "eslint-config-prettier"],
  "./eslint/react": ["eslint-plugin-react-hooks"],
  "./prettier": ["prettier", "@ianvs/prettier-plugin-sort-imports"],
  "./tsdown": ["tsdown"],
  "./lefthook/lefthook.yml": ["lefthook"],
};

describe("a developer importing a subpath", () => {
  test.each(Object.entries(pkg.exports))("can resolve %s", (_subpath, target) => {
    expect(existsSync(path.join(root, target))).toBe(true);
  });
});

describe("a developer following the install instructions", () => {
  test.each(Object.entries(requiredPeersBySubpath))(
    "installing the documented peers for %s is enough, nothing extra is silently required",
    (subpath, peers) => {
      expect(pkg.exports).toHaveProperty(subpath);
      for (const peer of peers) {
        expect(
          pkg.peerDependencies,
          `missing peerDependency "${peer}" for ${subpath}`,
        ).toHaveProperty(peer);
        expect(
          (pkg.peerDependenciesMeta as Record<string, { optional?: boolean }>)[peer]?.optional,
          `peerDependency "${peer}" should be optional, so unrelated subpaths aren't forced on a developer who doesn't use them`,
        ).toBe(true);
      }
    },
  );
});
