import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

// The skills this marketplace ships are held to the rules its own skill-builder checks, by the
// same script a person runs, so the shelf never asks of others what it does not do itself.

const root = import.meta.dirname;
const check = path.join(root, "plugins/skill-builder/skills/skill-builder/scripts/check.mjs");

function run(...args: string[]) {
  return spawnSync(process.execPath, [check, ...args], { cwd: root, encoding: "utf8" });
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}

describe("the skills this marketplace ships", () => {
  test("every one holds the four rules: named, small, resolves, tested", () => {
    const { status, stdout } = run("--json");
    const report = JSON.parse(stdout) as { findings: unknown[] };
    expect(report.findings).toEqual([]);
    expect(status).toBe(0);
  });

  test("the template's skill holds them too, so a plugin copied from it starts clean", () => {
    expect(run("templates/plugin-template/skills").status).toBe(0);
  });

  test("the template's skill stays out of the skills CLI's listings, so nobody installs a TODO", () => {
    const entries = filesUnder(path.join(root, "templates")).filter((file) =>
      file.endsWith("SKILL.md"),
    );
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(readFileSync(entry, "utf8"), entry).toMatch(/^metadata:\n\s+internal: true$/m);
    }
  });
});
