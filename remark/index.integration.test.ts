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
      `import base from ${JSON.stringify(path.join(root, "remark", "index.mjs"))};`,
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

describe("remark/index.mjs", () => {
  test("flags a missing final newline", () => {
    const { status, output } = lint("# Title\n\nSome text.");
    expect(status).toBe(1);
    expect(output).toContain("final-newline");
  });

  test("raises no warnings on clean markdown", () => {
    const { status } = lint("# Title\n\nSome text.\n");
    expect(status).toBe(0);
  });

  test("without frontmatter/gfm support, misflags a doc with frontmatter and a task list", () => {
    // The exact failure mode remark/docs.mjs exists to fix: YAML frontmatter's list items read
    // as misindented Markdown list items, and GFM task-list checkboxes read as undefined link
    // references, once index.mjs alone (recommended rules, no extensions) parses the doc.
    const { status, output } = lint(
      "---\ntags:\n  - docs\n  - guide\n---\n\n# Title\n\n- [ ] Do the thing\n- [x] Done thing\n",
    );
    expect(status).toBe(1);
    expect(output).toContain("list-item-bullet-indent");
    expect(output).toContain("no-undefined-references");
  });
});
