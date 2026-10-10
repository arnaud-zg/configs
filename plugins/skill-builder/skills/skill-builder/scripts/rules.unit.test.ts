import { describe, expect, test } from "vitest";

import { inspectShelf } from "./rules.mjs";

type Pages = Record<string, string>;

/** A shelf as `inspectShelf` reads it: skill name → path inside the skill → text. */
function shelfOf(skills: Record<string, Pages>) {
  return new Map(
    Object.entries(skills).map(([name, pages]) => [name, new Map(Object.entries(pages))]),
  );
}

function entry(
  name: string,
  body = "# A skill\n",
  description = "Does one thing. Use when asked.",
) {
  return `---\nname: ${name}\ndescription: ${description}\n---\n${body}`;
}

function lines(count: number, prefix = "line") {
  return Array.from({ length: count }, (_, index) => `${prefix} ${String(index + 1)}`).join("\n");
}

/** Only the parts a reader of the report needs: which rule, where, and what it says. */
function findingsOf(skills: Record<string, Pages>, options = {}) {
  return inspectShelf(shelfOf(skills), options).map(({ rule, file, line, message }) => ({
    rule,
    file,
    line,
    message,
  }));
}

describe("a well-built skill", () => {
  test("given a skill named for its folder that says when to use it, then nothing is found", () => {
    expect(findingsOf({ tidy: { "SKILL.md": entry("tidy") } })).toEqual([]);
  });

  test("given an empty shelf, then nothing is found", () => {
    expect(findingsOf({})).toEqual([]);
  });

  test("every finding names the skill it is in and how to fix it", () => {
    const [finding] = inspectShelf(shelfOf({ tidy: { "SKILL.md": entry("messy") } }), {});
    expect(finding?.skill).toBe("tidy");
    expect(finding?.fix).toBe("set name: tidy");
  });
});

describe("named: a skill is found and loaded by its name and its description", () => {
  test("given an entry named for another folder, then the name line is flagged", () => {
    expect(findingsOf({ tidy: { "SKILL.md": entry("messy") } })).toEqual([
      {
        rule: "named",
        file: "SKILL.md",
        line: 2,
        message: 'the entry is named "messy", not "tidy"',
      },
    ]);
  });

  test("given an entry with no frontmatter, then it is flagged once and nothing else is guessed", () => {
    expect(findingsOf({ tidy: { "SKILL.md": "# Tidy\n" } })).toEqual([
      { rule: "named", file: "SKILL.md", line: 1, message: "the entry has no frontmatter" },
    ]);
  });

  test("given a folder name with capitals, then it is flagged as not lowercase words joined by hyphens", () => {
    const [finding] = findingsOf({ Tidy_Up: { "SKILL.md": entry("Tidy_Up") } });
    expect(finding?.message).toMatch(/lowercase words joined by hyphens/);
  });

  test("given a description that never says when to use the skill, then it is flagged", () => {
    const skill = { "SKILL.md": entry("tidy", "# Tidy\n", "Tidies things up.") };
    expect(findingsOf({ tidy: skill })).toEqual([
      {
        rule: "named",
        file: "SKILL.md",
        line: 3,
        message: "the description never says when to use the skill",
      },
    ]);
  });

  test("given no description at all, then it is flagged", () => {
    const [finding] = findingsOf({ tidy: { "SKILL.md": "---\nname: tidy\n---\n# Tidy\n" } });
    expect(finding?.message).toBe("the entry has no description");
  });

  test("given a description folded over several lines, then all of it is read", () => {
    const text = "---\nname: tidy\ndescription:\n  Tidies things up.\n  Use when asked.\n---\n";
    expect(findingsOf({ tidy: { "SKILL.md": text } })).toEqual([]);
  });

  test("given a quoted block-scalar description, then its quotes and markers are not part of it", () => {
    const text = '---\nname: "tidy"\ndescription: >-\n  Tidies. Use when asked.\n---\n';
    expect(findingsOf({ tidy: { "SKILL.md": text } })).toEqual([]);
  });

  test("given a description longer than the 1024 characters a host keeps, then it is flagged", () => {
    const long = `Use when asked. ${"x".repeat(1024)}`;
    const [finding] = findingsOf({ tidy: { "SKILL.md": entry("tidy", "", long) } });
    expect(finding?.message).toBe("the description is 1040 characters, over 1024");
  });
});

describe("small: the entry is read on every call, so it routes rather than teaches", () => {
  const frontmatter = "---\nname: tidy\ndescription: Use when asked.\n---\n";

  test("given an entry body of exactly 150 lines, then nothing is found", () => {
    expect(findingsOf({ tidy: { "SKILL.md": frontmatter + lines(150) } })).toEqual([]);
  });

  test("given an entry body of 151 lines, then the first line over is flagged", () => {
    expect(findingsOf({ tidy: { "SKILL.md": frontmatter + lines(151) } })).toEqual([
      { rule: "small", file: "SKILL.md", line: 151, message: "SKILL.md is 151 lines, over 150" },
    ]);
  });

  test("given a page of exactly 300 lines, then nothing is found", () => {
    const skill = { "SKILL.md": entry("tidy"), "reference.md": lines(300) };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a page of 301 lines, then it is flagged against the page limit", () => {
    const skill = { "SKILL.md": entry("tidy"), "reference.md": lines(301) };
    expect(findingsOf({ tidy: skill })).toEqual([
      {
        rule: "small",
        file: "reference.md",
        line: 301,
        message: "reference.md is 301 lines, over 300",
      },
    ]);
  });

  test("given a long file that is not a page, then its length is not the rule's business", () => {
    const skill = { "SKILL.md": entry("tidy"), "data/table.json": lines(900) };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });
});

describe("resolves: a pointer to nothing sends the model nowhere", () => {
  test("given a link to a page that is gone, then the line of the link is flagged", () => {
    const skill = { "SKILL.md": entry("tidy", "# Tidy\n\nRead [the guide](guide.md).\n") };
    expect(findingsOf({ tidy: skill })).toEqual([
      { rule: "resolves", file: "SKILL.md", line: 7, message: "guide.md does not exist" },
    ]);
  });

  test("given a link to a page that exists, then nothing is found", () => {
    const skill = {
      "SKILL.md": entry("tidy", "[the guide](docs/guide.md)\n"),
      "docs/guide.md": "",
    };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a link from a nested page, then it resolves from that page's own folder", () => {
    const skill = {
      "SKILL.md": entry("tidy"),
      "docs/guide.md": "[back](../SKILL.md) and [next](next.md)\n",
      "docs/next.md": "",
    };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a link to a folder of the skill, then the folder is enough", () => {
    const skill = { "SKILL.md": entry("tidy", "[scripts](scripts/)\n"), "scripts/a.sh": "" };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a link to a heading that is not there, then it is flagged", () => {
    const skill = {
      "SKILL.md": entry("tidy", "[steps](guide.md#the-steps)\n"),
      "guide.md": "# Guide\n\n## Steps\n",
    };
    expect(findingsOf({ tidy: skill })).toEqual([
      {
        rule: "resolves",
        file: "SKILL.md",
        line: 5,
        message: "guide.md has no heading #the-steps",
      },
    ]);
  });

  test("given a link to a heading with formatting and punctuation, then its slug is matched", () => {
    const skill = {
      "SKILL.md": entry("tidy", "[it](guide.md#check-a-skill-before-editing)\n"),
      "guide.md": "## Check a **skill**, before `editing`!\n",
    };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a link to the second of two equal headings, then its numbered slug is matched", () => {
    const skill = {
      "SKILL.md": entry("tidy", "[it](guide.md#notes-1)\n"),
      "guide.md": "## Notes\n\n## Notes\n",
    };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a link to a heading on the same page, then the page's own headings are read", () => {
    const skill = { "SKILL.md": entry("tidy", "# Tidy\n\n[up](#tidy) and [down](#gone)\n") };
    expect(findingsOf({ tidy: skill })).toEqual([
      { rule: "resolves", file: "SKILL.md", line: 7, message: "SKILL.md has no heading #gone" },
    ]);
  });

  test("given links to the web, to mail and outside the shelf, then none of them is the rule's business", () => {
    const body =
      "[a](https://example.com/x.md) [b](mailto:a@b.c) [c](../../README.md) [d](/abs.md)\n";
    expect(findingsOf({ tidy: { "SKILL.md": entry("tidy", body) } })).toEqual([]);
  });

  test("given a link to a sibling skill's page, then it is looked for in that skill", () => {
    const shelf = {
      tidy: { "SKILL.md": entry("tidy", "[ok](../sweep/SKILL.md) [gone](../sweep/gone.md)\n") },
      sweep: { "SKILL.md": entry("sweep") },
    };
    expect(findingsOf(shelf)).toEqual([
      { rule: "resolves", file: "SKILL.md", line: 5, message: "../sweep/gone.md does not exist" },
    ]);
  });

  test("given a path in prose inside a folder the skill has, then it must exist", () => {
    const skill = {
      "SKILL.md": entry("tidy", "Run `scripts/run.mjs`, then `scripts/gone.mjs`.\n"),
      "scripts/run.mjs": "",
      "scripts/run.test.mjs": "import './run.mjs'",
    };
    expect(findingsOf({ tidy: skill })).toEqual([
      { rule: "resolves", file: "SKILL.md", line: 5, message: "scripts/gone.mjs does not exist" },
    ]);
  });

  test("given a path in prose inside a folder the skill does not have, then it is the project's", () => {
    const skill = { "SKILL.md": entry("tidy", "Edit `src/app/index.ts` in your project.\n") };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a path from the skill's own folder inside a code block, then it is still checked", () => {
    const body = "```sh\nnode ${CLAUDE_SKILL_DIR}/scripts/gone.mjs\n```\n";
    expect(findingsOf({ tidy: { "SKILL.md": entry("tidy", body) } })).toEqual([
      {
        rule: "resolves",
        file: "SKILL.md",
        line: 6,
        message: "${CLAUDE_SKILL_DIR}/scripts/gone.mjs does not exist",
      },
    ]);
  });

  test("given an example link inside a code block, then it is not read as a pointer", () => {
    const body = "```md\n[x](missing.md) and `scripts/missing.mjs`\n```\n";
    const skill = {
      "SKILL.md": entry("tidy", body),
      "scripts/a.mjs": "",
      "scripts/a.test.mjs": 'import "./a.mjs";',
    };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given one missing page written as a link, then it is reported once, not twice", () => {
    const skill = { "SKILL.md": entry("tidy", "[it](scripts/gone.mjs)\n"), "scripts/a.sh": "" };
    const found = findingsOf({ tidy: skill }).filter((finding) => finding.rule === "resolves");
    expect(found).toHaveLength(1);
  });

  test("given a story cited and never written down, then the citation is flagged", () => {
    const skill = { "SKILL.md": entry("tidy", "Keep it short (why: E-01).\n") };
    expect(findingsOf({ tidy: skill })).toEqual([
      {
        rule: "resolves",
        file: "SKILL.md",
        line: 5,
        message: "E-01 is cited, and evidence.md has no such entry",
      },
    ]);
  });

  test("given a story cited and written down in evidence.md, then nothing is found", () => {
    const skill = {
      "SKILL.md": entry("tidy", "Keep it short (why: E-01).\n"),
      "evidence.md": "# Evidence\n\n## E-01 · A long entry\n",
    };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a skill in a family, then it cites the stories its family wrote down", () => {
    const shelf = {
      tidy: { "SKILL.md": entry("tidy"), "evidence.md": "**E-02** · A story\n" },
      sweep: {
        "SKILL.md": `---\nname: sweep\ndescription: Use when asked.\nmetadata:\n  family: tidy\n---\n(why: E-02)\n`,
      },
    };
    expect(findingsOf(shelf)).toEqual([]);
  });
});

describe("tested: a script nobody tests was only ever watched", () => {
  test("given a script no test reaches, then it is flagged", () => {
    const skill = { "SKILL.md": entry("tidy"), "scripts/sweep.mjs": "" };
    expect(findingsOf({ tidy: skill })).toEqual([
      {
        rule: "tested",
        file: "scripts/sweep.mjs",
        line: 1,
        message: "scripts/sweep.mjs is reached by no test",
      },
    ]);
  });

  test("given a script a test imports, then nothing is found", () => {
    const skill = {
      "SKILL.md": entry("tidy"),
      "scripts/sweep.mjs": "",
      "scripts/sweep.test.ts": 'import { sweep } from "./sweep.mjs";',
    };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a script reached only through another script a test imports, then it counts as tested", () => {
    const skill = {
      "SKILL.md": entry("tidy"),
      "scripts/cli.mjs": 'import { read } from "./read.mjs";',
      "scripts/read.mjs": "",
      "scripts/cli.test.ts": 'spawnSync("node", ["cli.mjs"]);',
    };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a Python script its test imports by module name, then it counts as tested", () => {
    const skill = {
      "SKILL.md": entry("tidy"),
      "scripts/sweep.py": "",
      "scripts/test_sweep.py": "from sweep import run",
    };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });

  test("given a test outside the suite that runs the tests, then the test is flagged", () => {
    const skill = {
      "SKILL.md": entry("tidy"),
      "scripts/sweep.mjs": "",
      "scripts/sweep.test.mjs": 'import "./sweep.mjs";',
    };
    const options = { suite: ["node", "--test"], suiteName: "test", pathOf: () => "skills/tidy" };
    expect(findingsOf({ tidy: skill }, options)).toEqual([
      {
        rule: "tested",
        file: "scripts/sweep.test.mjs",
        line: 1,
        message: "scripts/sweep.test.mjs is a test the test script never runs",
      },
    ]);
  });

  test("given a test the suite names by its path, then nothing is found", () => {
    const skill = {
      "SKILL.md": entry("tidy"),
      "scripts/sweep.mjs": "",
      "scripts/sweep.test.mjs": 'import "./sweep.mjs";',
    };
    const suite = ["node", "--test", "skills/tidy/scripts/sweep.test.mjs"];
    const options = { suite, suiteName: "test", pathOf: () => "skills/tidy" };
    expect(findingsOf({ tidy: skill }, options)).toEqual([]);
  });

  test("given no suite, then where a test runs is not checked", () => {
    const skill = { "SKILL.md": entry("tidy"), "scripts/sweep.test.mjs": "" };
    expect(findingsOf({ tidy: skill })).toEqual([]);
  });
});

describe("which skills are reported", () => {
  test("given a shelf and one skill asked for, then only that skill's findings are reported", () => {
    const shelf = {
      tidy: { "SKILL.md": entry("tidy", "[ok](../broken/SKILL.md)\n") },
      broken: { "SKILL.md": entry("wrong") },
    };
    expect(findingsOf(shelf, { only: ["tidy"] })).toEqual([]);
  });

  test("findings come rule by rule within a skill, in the order the rules are listed", () => {
    const skill = { "SKILL.md": entry("wrong", "[x](gone.md)\n"), "scripts/a.mjs": "" };
    expect(findingsOf({ tidy: skill }).map((finding) => finding.rule)).toEqual([
      "named",
      "resolves",
      "tested",
    ]);
  });
});
