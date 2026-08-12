import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const scriptPath = path.join(root, "lefthook/check-commit-msg.sh");

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

  // lefthook.yml's `extends` always wins over lefthook.yml's own settings (merge order is
  // lefthook.yml -> extends -> remotes -> lefthook-local.yml), so this repo overrides the shared
  // config's consumer-facing commit-msg path (node_modules/@arnaud-zg/configs/...) via
  // lefthook-local.yml, the only file with higher precedence than `extends`. A real `git commit`
  // in this repo would be broken without it.
  test("lefthook-local.yml overrides the shared config's commit-msg path", () => {
    const output = execFileSync(path.join(root, "node_modules/.bin/lefthook"), ["dump"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(output).toContain("run: sh lefthook/check-commit-msg.sh {1}");
    expect(output).not.toContain("node_modules/@arnaud-zg/configs/lefthook/check-commit-msg.sh");
  });
});

describe("check-commit-msg.sh", () => {
  let tmpDir: string | undefined;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  });

  function checkSubject(subject: string): number {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "commit-msg-"));
    const msgFile = path.join(tmpDir, "msg.txt");
    writeFileSync(msgFile, `${subject}\n`);
    try {
      execFileSync("sh", [scriptPath, msgFile], { stdio: "pipe" });
      return 0;
    } catch (error) {
      return (error as { status: number }).status;
    }
  }

  test.each([
    "feat(scope): add thing",
    "fix(x): [JIRA-1] bug",
    "chore(deps): bump typescript",
    "feat(scope)!: breaking change",
    "fix(x)!: [JIRA-1] breaking bug fix",
    "Merge branch 'x'",
    'Revert "feat(x): oops"',
  ])("accepts %s", (subject) => {
    expect(checkSubject(subject)).toBe(0);
  });

  test.each([
    "random commit message",
    "feat: missing scope",
    "feat(scope) missing colon",
    "feat(scope)! missing colon",
  ])("rejects %s", (subject) => {
    expect(checkSubject(subject)).toBe(1);
  });
});
