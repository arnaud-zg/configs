import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, test } from "vitest";

const root = import.meta.dirname;

describe("lefthook.yml extends chain", () => {
  test("dump merges the root config with the shared base", () => {
    const output = execFileSync(path.join(root, "node_modules/.bin/lefthook"), ["dump"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(output).toContain("pre-commit:");
    expect(output).toContain("commit-msg:");
    expect(output).toContain("post-checkout:");
    expect(output).toContain("post-merge:");
    expect(output).toContain("protect-main");
  });

  test("commit-msg hook delegates to commitlint", () => {
    const output = execFileSync(path.join(root, "node_modules/.bin/lefthook"), ["dump"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(output).toContain("pnpm exec commitlint --edit {1}");
  });
});
