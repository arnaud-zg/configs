import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import pkg from "../package.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");

// Peers actually required at runtime by each subpath. Mirrors what a developer following the
// docs would install: only the peers for the subpath they picked, nothing else.
const requiredPeersBySubpath: Record<string, string[]> = {
  "./eslint": ["eslint", "@eslint/js", "typescript-eslint", "eslint-config-prettier"],
  "./eslint/react": ["eslint-plugin-react", "eslint-plugin-jsx-a11y", "eslint-plugin-react-hooks"],
  "./prettier": ["prettier", "@ianvs/prettier-plugin-sort-imports", "prettier-plugin-packagejson"],
  "./tsdown": ["tsdown", "typescript"],
  "./lefthook/lefthook.yml": ["lefthook", "prettier", "@commitlint/cli"],
  "./remark": ["remark-cli", "remark-preset-lint-recommended"],
  "./remark/docs": [
    "remark-cli",
    "remark-preset-lint-recommended",
    "remark-frontmatter",
    "remark-gfm",
  ],
  "./commitlint": ["@commitlint/cli", "@commitlint/config-conventional"],
};

describe("a developer importing a subpath", () => {
  // Every subpath except ./tsdown resolves straight to a checked-in source file, so its target
  // exists on a fresh clone with no build step. ./tsdown resolves to built dist/ output instead
  // (see __tests__/tsdown.test.ts and __tests__/tsdown-consumer.test.ts for why, and for coverage
  // that the build actually produces it), so it's asserted separately below rather than requiring
  // a build before this test file can run.
  const sourceExports = Object.entries(pkg.exports).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );

  test.each(sourceExports)("can resolve %s", (_subpath, target) => {
    expect(existsSync(path.join(root, target))).toBe(true);
  });

  test("./tsdown resolves to built dist/ output, not raw source", () => {
    // Raw tsdown/base.ts can't be the export target: unrun (tsdown's config loader) refuses to
    // strip types for files resolved under node_modules, so a consumer's tsdown.config.ts
    // importing this subpath would fail outright.
    expect(pkg.exports["./tsdown"]).toEqual({
      types: "./dist/base.d.ts",
      default: "./dist/base.js",
    });
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
