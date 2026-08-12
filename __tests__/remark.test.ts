import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const remarkBin = path.join(root, "node_modules/.bin/remark");

describe("remark/index.mjs", () => {
  let tmpDir: string | undefined;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  });

  function lint(markdown: string): { status: number; output: string } {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "remark-test-"));
    writeFileSync(path.join(tmpDir, "fixture.md"), markdown);
    writeFileSync(
      path.join(tmpDir, ".remarkrc.mjs"),
      [
        `import base from ${JSON.stringify(path.join(root, "remark/index.mjs"))};`,
        "export default base;",
        "",
      ].join("\n"),
    );
    try {
      const output = execFileSync(remarkBin, ["fixture.md", "--frail", "--quiet"], {
        cwd: tmpDir,
        encoding: "utf8",
        stdio: "pipe",
      });
      return { status: 0, output };
    } catch (error) {
      const err = error as { status: number; stderr: string };
      return { status: err.status, output: err.stderr };
    }
  }

  test("flags a missing final newline", () => {
    const { status, output } = lint("# Title\n\nSome text.");
    expect(status).toBe(1);
    expect(output).toContain("final-newline");
  });

  test("raises no warnings on clean markdown", () => {
    // remark echoes the processed document to stdout regardless of lint outcome, so success here
    // is the exit code, not empty output.
    const { status } = lint("# Title\n\nSome text.\n");
    expect(status).toBe(0);
  });
});
