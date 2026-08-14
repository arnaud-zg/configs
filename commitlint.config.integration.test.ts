import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

const root = import.meta.dirname;

// Exercises the same rules a consumer gets from @arnaud-zg/configs/commitlint, auto-discovered
// the same way lefthook's commit-msg hook does (`pnpm exec commitlint --edit {1}`).
describe("commitlint.config.mjs", () => {
  let tmpDir: string | undefined;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  });

  function checkSubject(subject: string): number {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "commitlint-test-"));
    const msgFile = path.join(tmpDir, "msg.txt");
    writeFileSync(msgFile, `${subject}\n`);
    try {
      execFileSync(path.join(root, "node_modules/.bin/commitlint"), ["--edit", msgFile], {
        cwd: root,
        stdio: "pipe",
      });
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
