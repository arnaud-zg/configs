import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

// The check as a person runs it: `node check.mjs` in a real folder, read from its exit code and
// what it prints. Every project here is written to a temporary folder; nothing is mocked.

const CHECK = path.join(import.meta.dirname, "check.mjs");

let project: string | undefined;

afterEach(() => {
  if (project) rmSync(project, { recursive: true, force: true });
  project = undefined;
});

/** A temporary project holding these files, by path from its root. */
function projectWith(files: Record<string, string>) {
  project = mkdtempSync(path.join(os.tmpdir(), "hexagonal-skill-builder-check-"));
  for (const [relative, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(project, relative)), { recursive: true });
    writeFileSync(path.join(project, relative), text);
  }
  return project;
}

function entry(name: string, body = "# A skill\n") {
  return `---\nname: ${name}\ndescription: Does one thing. Use when asked.\n---\n${body}`;
}

function check(cwd: string, ...args: string[]) {
  const { status, stdout, stderr } = spawnSync(process.execPath, [CHECK, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "", FORCE_COLOR: "" },
  });
  return { status, stdout, stderr };
}

describe("given a project whose skills hold every rule", () => {
  test("when the check runs with no path, then it finds .claude/skills, says so and exits 0", () => {
    const cwd = projectWith({ ".claude/skills/tidy/SKILL.md": entry("tidy") });
    const { status, stdout } = check(cwd);
    expect(status).toBe(0);
    expect(stdout).toContain("✓ tidy");
    expect(stdout).toContain("1 skill holds all four rules.");
  });

  test("when the skills sit in skills/, .agents/skills and plugins/*/skills, then it finds all of them", () => {
    const cwd = projectWith({
      "skills/one/SKILL.md": entry("one"),
      ".agents/skills/two/SKILL.md": entry("two"),
      "plugins/kit/skills/three/SKILL.md": entry("three"),
    });
    const { status, stdout } = check(cwd);
    expect(status).toBe(0);
    expect(stdout).toContain("3 skills hold all four rules.");
    expect(stdout).toContain("plugins/kit/skills");
  });

  test("when a skill is installed as a link to its folder, then the link is followed", () => {
    const cwd = projectWith({ "vendor/tidy/SKILL.md": entry("tidy") });
    mkdirSync(path.join(cwd, ".claude/skills"), { recursive: true });
    symlinkSync(path.join(cwd, "vendor/tidy"), path.join(cwd, ".claude/skills/tidy"));
    expect(check(cwd).stdout).toContain("✓ tidy");
  });

  test("when it prints, then it writes no colour codes to a pipe", () => {
    const cwd = projectWith({ ".claude/skills/tidy/SKILL.md": entry("tidy") });
    expect(check(cwd).stdout).not.toContain("\u001b[");
  });
});

describe("given a skill that breaks a rule", () => {
  const broken = {
    ".claude/skills/tidy/SKILL.md": entry("tidy"),
    ".claude/skills/messy/SKILL.md": entry("messy", "# Messy\n\nRead [the guide](guide.md).\n"),
  };

  test("when the check runs, then it exits 1", () => {
    expect(check(projectWith(broken)).status).toBe(1);
  });

  test("when the check runs, then it prints the file and line from the project root, the rule, and the fix", () => {
    const { stdout } = check(projectWith(broken));
    expect(stdout).toContain(".claude/skills/messy/SKILL.md:7");
    expect(stdout).toContain("resolves");
    expect(stdout).toContain("guide.md does not exist");
    expect(stdout).toContain("→ point at where it lives now, or remove the pointer");
  });

  test("when the check runs, then the skills that hold are still listed as holding", () => {
    const { stdout } = check(projectWith(broken));
    expect(stdout).toContain("✓ tidy");
    expect(stdout).toContain("✗ messy");
    expect(stdout).toContain("1 finding in 1 of 2 skills.");
  });

  test("when asked for JSON, then every finding carries its path and nothing else is printed", () => {
    const { status, stdout } = check(projectWith(broken), "--json");
    const report = JSON.parse(stdout) as {
      skills: { name: string; path: string }[];
      findings: { skill: string; rule: string; path: string; line: number; fix: string }[];
    };
    expect(status).toBe(1);
    expect(report.skills.map((skill) => skill.name)).toEqual(["messy", "tidy"]);
    expect(report.findings).toEqual([
      expect.objectContaining({
        skill: "messy",
        rule: "resolves",
        path: ".claude/skills/messy/SKILL.md",
        line: 7,
      }),
    ]);
  });
});

describe("given a path", () => {
  test("when it is one skill's folder, then only that skill is checked, with its siblings still there to point at", () => {
    const cwd = projectWith({
      ".claude/skills/tidy/SKILL.md": entry("tidy", "[it](../messy/SKILL.md)\n"),
      ".claude/skills/messy/SKILL.md": entry("wrong-name"),
    });
    const { status, stdout } = check(cwd, ".claude/skills/tidy");
    expect(status).toBe(0);
    expect(stdout).not.toContain("messy");
  });

  test("when it is a folder of skills, then every skill in it is checked", () => {
    const cwd = projectWith({ "kit/a/SKILL.md": entry("a"), "kit/b/SKILL.md": entry("b") });
    expect(check(cwd, "kit").stdout).toContain("2 skills hold all four rules.");
  });

  test("when it does not exist, then it says so and exits 2", () => {
    const { status, stderr } = check(projectWith({}), "nowhere");
    expect(status).toBe(2);
    expect(stderr).toContain("nowhere does not exist");
  });
});

describe("given nothing to check", () => {
  test("when the project has no skills, then it names where it looked and exits 2", () => {
    const { status, stderr } = check(projectWith({ "README.md": "# Hi\n" }));
    expect(status).toBe(2);
    expect(stderr).toContain("No skills found");
    expect(stderr).toContain(".claude/skills");
    expect(stderr).toContain("plugins/*/skills");
  });

  test("when a flag is not one it knows, then it prints how to use it and exits 2", () => {
    const { status, stderr } = check(projectWith({}), "--fast");
    expect(status).toBe(2);
    expect(stderr).toContain("Usage: node check.mjs");
  });
});

describe("given a suite that runs the project's tests", () => {
  const skill = {
    ".claude/skills/tidy/SKILL.md": entry("tidy"),
    ".claude/skills/tidy/scripts/sweep.mjs": "export const sweep = 1;\n",
    ".claude/skills/tidy/scripts/sweep.test.mjs": 'import "./sweep.mjs";\n',
  };

  test("when the suite names the skill's test, then it holds", () => {
    const cwd = projectWith({
      ...skill,
      "package.json": JSON.stringify({
        scripts: { "test:skills": "node --test .claude/skills/tidy/scripts/sweep.test.mjs" },
      }),
    });
    expect(check(cwd, "--suite", "test:skills").status).toBe(0);
  });

  test("when the suite leaves the skill's test out, then the test is flagged by name", () => {
    const cwd = projectWith({
      ...skill,
      "package.json": JSON.stringify({ scripts: { "test:skills": "node --test" } }),
    });
    const { status, stdout } = check(cwd, "--suite", "test:skills");
    expect(status).toBe(1);
    expect(stdout).toContain("scripts/sweep.test.mjs is a test the test:skills script never runs");
  });

  test("when package.json has no such script, then it says so and exits 2", () => {
    const cwd = projectWith({ ...skill, "package.json": JSON.stringify({ scripts: {} }) });
    const { status, stderr } = check(cwd, "--suite", "test:skills");
    expect(status).toBe(2);
    expect(stderr).toContain('package.json has no "test:skills" script');
  });
});
