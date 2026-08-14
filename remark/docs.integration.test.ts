import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const remarkBin = path.join(root, "node_modules/.bin/remark");

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
      `import base from ${JSON.stringify(path.join(root, "remark", "docs.mjs"))};`,
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

describe("remark/docs.mjs", () => {
  test("raises no warnings on a doc with frontmatter and task-list checkboxes", () => {
    const { status } = lint(
      "---\ntags:\n  - docs\n  - guide\n---\n\n# Title\n\n- [ ] Do the thing\n- [x] Done thing\n",
    );
    expect(status).toBe(0);
  });

  test("still flags a missing final newline (inherits index.mjs's recommended rules)", () => {
    const { status, output } = lint("# Title\n\nSome text.");
    expect(status).toBe(1);
    expect(output).toContain("final-newline");
  });
});
