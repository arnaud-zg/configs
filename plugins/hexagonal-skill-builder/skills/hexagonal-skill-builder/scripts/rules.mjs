// The four rules a skill is held to, as pure functions over a shelf of skills.
//
//   named     the entry is named for its folder, and its description says when to use it
//   small     the entry's body fits in 150 lines, and every other page in 300
//   resolves  every link, path, heading and cited story a page points at exists
//   tested    every script is reached by a test and, given a suite, every test is in it
//
// A shelf is a map of skill name to a map of each file's path inside the skill to its text.
// Nothing here reads the disk: `check.mjs` does, and calls `inspectShelf`.

import { posix } from "node:path";

/** @typedef {Map<string, Map<string, string>>} Shelf */
/** @typedef {"named" | "small" | "resolves" | "tested"} Rule */
/**
 * @typedef {object} Finding
 * @property {string} skill
 * @property {Rule} rule
 * @property {string} file the path inside the skill
 * @property {number} line
 * @property {string} message
 * @property {string} fix
 */
/**
 * @typedef {object} Options
 * @property {string[] | null} [suite] the words of the script that runs the tests, if any
 * @property {string} [suiteName] that script's name, for the message
 * @property {(skill: string) => string} [pathOf] a skill's folder as the suite would name it
 * @property {string[]} [only] the skills to report; every skill on the shelf when left out
 */
/** @typedef {(rule: Rule, file: string, line: number, message: string, fix: string) => void} Add */

export const RULES = /** @type {const} */ (["named", "small", "resolves", "tested"]);
export const LIMITS = { entry: 150, page: 300, name: 64, description: 1024 };

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WHEN = /\b(?:use|when)\b/i;
const SCRIPT = /^scripts\/.+\.(?:[cm]?[jt]sx?|py|sh)$/;
const TEST = /(?:\.(?:test|spec)\.[cm]?[jt]sx?|(?:^|\/)test_[^/]+\.py|_test\.py)$/;
const LINK = /!?\[[^\]\n]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const A_LINK = new RegExp(LINK.source);
const SKILL_DIR = /\$\{CLAUDE_SKILL_DIR\}\/([\w./-]*[\w/])/g;
const BARE = /(?<![\w./@$-])((?:\.\.\/)?(?:[\w.-]+\/)+[\w.-]*\w\.[a-z]{1,4})(?![\w/-])/g;
const CITATION = /\bE-\d{2,}\b/g;
const DEFINED = /^(?:#+\s+|\*\*)(E-\d{2,})\b/gm;

/** @param {string} text @param {number} index */
const lineOf = (text, index) => text.slice(0, index).split("\n").length;

/** The text with every character but line breaks blanked, so lines keep their numbers. */
const blank = (/** @type {string} */ text) => text.replace(/[^\n]/g, " ");

/** The text with its code blocks blanked, so an example is never read as a pointer. */
const readable = (/** @type {string} */ text) =>
  text.replace(/^(```|~~~)[\s\S]*?^\1/gm, (block) => blank(block));

/** @param {string} text */
function frontmatterOf(text) {
  return /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)?.[1] ?? null;
}

/** A field's value, folded across its indented lines, with YAML's quotes and markers removed. */
function fieldOf(/** @type {string} */ front, /** @type {string} */ key) {
  const match = new RegExp(`^${key}:[ \\t]*(.*)\\n?((?:[ \\t]+.*\\n?)*)`, "m").exec(front);
  if (!match) return "";
  const value = `${match[1] ?? ""} ${match[2] ?? ""}`.replace(/^\s*[>|][-+]?/, "");
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2");
}

/** @param {string} text @param {string} key */
function lineOfField(text, key) {
  const match = new RegExp(`^${key}:`, "m").exec(text);
  return match ? lineOf(text, match.index) : 1;
}

/** @param {Shelf} shelf @param {string} name @param {Add} add */
function named(shelf, name, add) {
  const text = shelf.get(name)?.get("SKILL.md") ?? "";
  const front = frontmatterOf(text);
  if (front === null) {
    add(
      "named",
      "SKILL.md",
      1,
      "the entry has no frontmatter",
      `start SKILL.md with ---, name: ${name}, a description, then ---`,
    );
    return;
  }
  const declared = fieldOf(front, "name");
  if (declared !== name) {
    const message = declared
      ? `the entry is named "${declared}", not "${name}"`
      : "the entry has no name";
    add("named", "SKILL.md", lineOfField(text, "name"), message, `set name: ${name}`);
  }
  if (!NAME.test(name) || name.length > LIMITS.name) {
    add(
      "named",
      "SKILL.md",
      lineOfField(text, "name"),
      `"${name}" is not lowercase words joined by hyphens, at most ${String(LIMITS.name)} characters`,
      "rename the folder and the entry, e.g. tidy-imports",
    );
  }
  description(text, fieldOf(front, "description"), add);
}

/** @param {string} text @param {string} said @param {Add} add */
function description(text, said, add) {
  const line = lineOfField(text, "description");
  if (said === "") {
    add(
      "named",
      "SKILL.md",
      line,
      "the entry has no description",
      'add a description: what it does, then "Use when …"',
    );
    return;
  }
  if (!WHEN.test(said)) {
    add(
      "named",
      "SKILL.md",
      line,
      "the description never says when to use the skill",
      'add a "Use when …" sentence with the words a person would type',
    );
  }
  if (said.length > LIMITS.description) {
    add(
      "named",
      "SKILL.md",
      line,
      `the description is ${String(said.length)} characters, over ${String(LIMITS.description)}`,
      "put the use case first and cut the rest",
    );
  }
}

/** @param {Shelf} shelf @param {string} name @param {Add} add */
function small(shelf, name, add) {
  for (const [file, text] of shelf.get(name) ?? []) {
    if (!file.endsWith(".md")) continue;
    const isEntry = file === "SKILL.md";
    const counted = isEntry ? text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "") : text;
    const count = counted.replace(/\n$/, "").split("\n").length;
    const limit = isEntry ? LIMITS.entry : LIMITS.page;
    if (count <= limit) continue;
    add(
      "small",
      file,
      limit + 1,
      `${file} is ${String(count)} lines, over ${String(limit)}`,
      "cut what is said twice, or move a part into its own page and link to it",
    );
  }
}

/** A heading's anchor as GitHub writes it: lowercase, punctuation dropped, spaces to hyphens. */
function slugOf(/** @type {string} */ heading) {
  return heading
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/g, "-");
}

/** Every anchor a page offers, with GitHub's `-1`, `-2` for headings that repeat. */
function anchorsOf(/** @type {string} */ text) {
  /** @type {Map<string, number>} */
  const seen = new Map();
  const anchors = new Set();
  for (const match of readable(text).matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const slug = slugOf(match[1] ?? "");
    const count = seen.get(slug) ?? 0;
    anchors.add(count === 0 ? slug : `${slug}-${String(count)}`);
    seen.set(slug, count + 1);
  }
  return anchors;
}

/**
 * Where a path inside a skill points: a file in this skill, a file in a sibling skill, or null
 * when it leaves the shelf and so belongs to the project.
 * @param {Shelf} shelf @param {string} name @param {string} joined a normalised posix path
 */
function targetOf(shelf, name, joined) {
  if (!joined.startsWith("../")) return { skill: name, file: joined };
  const [sibling, ...rest] = joined.slice(3).split("/");
  if (sibling === undefined || sibling === ".." || !shelf.has(sibling)) return null;
  return { skill: sibling, file: rest.join("/") };
}

/** @param {Shelf} shelf @param {{ skill: string, file: string }} target */
function exists(shelf, target) {
  const files = shelf.get(target.skill);
  if (!files) return false;
  const folder = target.file.replace(/\/$/, "");
  return files.has(folder) || [...files.keys()].some((file) => file.startsWith(`${folder}/`));
}

/** @param {Shelf} shelf @param {string} name @param {Add} add */
function pointers(shelf, name, add) {
  const files = shelf.get(name) ?? new Map();
  const folders = new Set([...files.keys()].map((file) => file.split("/")[0]));
  for (const [file, text] of files) {
    if (!file.endsWith(".md")) continue;
    let rest = readable(text);
    /** @param {number} index @param {string} message */
    const missing = (index, message) =>
      add(
        "resolves",
        file,
        lineOf(text, index),
        message,
        "point at where it lives now, or remove the pointer",
      );

    rest = rest.replace(/`[^`\n]*`/g, (code) => (A_LINK.test(code) ? blank(code) : code));
    for (const match of rest.matchAll(LINK)) {
      const written = match[1] ?? "";
      if (/^[a-z][\w+.-]*:|^\/|^\$\{/i.test(written)) continue;
      const [pathPart = "", anchor = ""] = written.split("#");
      const joined = pathPart
        ? posix.normalize(posix.join(posix.dirname(file), decodeURI(pathPart)))
        : file;
      const target = targetOf(shelf, name, joined);
      if (target === null) continue;
      if (!exists(shelf, target)) {
        missing(match.index, `${pathPart} does not exist`);
      } else if (anchor && target.file.endsWith(".md")) {
        const page = shelf.get(target.skill)?.get(target.file) ?? "";
        if (!anchorsOf(page).has(decodeURIComponent(anchor).toLowerCase())) {
          missing(match.index, `${pathPart || file} has no heading #${anchor}`);
        }
      }
    }
    rest = rest.replace(LINK, (link) => blank(link));

    for (const match of text.matchAll(SKILL_DIR)) {
      const inside = posix.normalize(match[1] ?? "");
      if (!exists(shelf, { skill: name, file: inside })) {
        missing(match.index, `${match[0]} does not exist`);
      }
    }
    rest = rest.replace(SKILL_DIR, (mention) => blank(mention));

    for (const match of rest.matchAll(BARE)) {
      const written = match[1] ?? "";
      const target = written.startsWith("../")
        ? targetOf(shelf, name, posix.normalize(written))
        : folders.has(written.split("/")[0])
          ? { skill: name, file: posix.normalize(written) }
          : null;
      if (target !== null && !exists(shelf, target))
        missing(match.index, `${written} does not exist`);
    }
  }
}

/** The skill whose evidence a skill cites: its `metadata.family`, or itself. */
function familyOf(/** @type {Shelf} */ shelf, /** @type {string} */ name) {
  const front = frontmatterOf(shelf.get(name)?.get("SKILL.md") ?? "") ?? "";
  const family = /^\s+family:\s*([\w-]+)/m.exec(front)?.[1];
  return family !== undefined && shelf.has(family) ? family : name;
}

/** @param {Shelf} shelf @param {string} name @param {Add} add */
function citations(shelf, name, add) {
  const evidence = shelf.get(familyOf(shelf, name))?.get("evidence.md") ?? "";
  const defined = new Set([...evidence.matchAll(DEFINED)].map((match) => match[1]));
  for (const [file, text] of shelf.get(name) ?? []) {
    if (!file.endsWith(".md") || file === "evidence.md") continue;
    for (const match of readable(text).matchAll(CITATION)) {
      if (defined.has(match[0])) continue;
      add(
        "resolves",
        file,
        lineOf(text, match.index),
        `${match[0]} is cited, and evidence.md has no such entry`,
        "cite an entry that exists, or write the story down in evidence.md",
      );
    }
  }
}

/** Whether a text names a script: by its file name, its quoted stem, or a Python import. */
function names(/** @type {string} */ text, /** @type {string} */ script) {
  const base = script.split("/").at(-1) ?? script;
  const stem = base.replace(/\.[^.]+$/, "");
  return (
    text.includes(base) ||
    new RegExp(`["'\`]${stem}["'\`]`).test(text) ||
    (base.endsWith(".py") &&
      new RegExp(`\\b(?:import|from)\\s+(?:[\\w.]*\\.)?${stem}\\b`).test(text))
  );
}

/** Every script a test names, and every script a reached script names in turn. */
function reached(/** @type {Map<string, string>} */ files) {
  const scripts = [...files.keys()].filter((file) => SCRIPT.test(file) && !TEST.test(file));
  const tests = [...files.keys()].filter((file) => TEST.test(file));
  const found = new Set(
    scripts.filter((script) => tests.some((test) => names(files.get(test) ?? "", script))),
  );
  for (let grew = true; grew;) {
    grew = false;
    for (const script of scripts.filter((candidate) => !found.has(candidate))) {
      if ([...found].some((by) => names(files.get(by) ?? "", script))) {
        found.add(script);
        grew = true;
      }
    }
  }
  return { scripts, tests, found };
}

/** @param {Shelf} shelf @param {string} name @param {Add} add @param {Options} options */
function tested(shelf, name, add, options) {
  const { scripts, tests, found } = reached(shelf.get(name) ?? new Map());
  for (const script of scripts.filter((candidate) => !found.has(candidate))) {
    add(
      "tested",
      script,
      1,
      `${script} is reached by no test`,
      "write a test that imports or runs it",
    );
  }
  const { suite, suiteName = "test", pathOf = () => "" } = options;
  if (!suite) return;
  for (const test of tests) {
    const path = posix.join(pathOf(name), test);
    if (suite.includes(path) || suite.includes(`./${path}`)) continue;
    add(
      "tested",
      test,
      1,
      `${test} is a test the ${suiteName} script never runs`,
      `add ${path} to the ${suiteName} script in package.json`,
    );
  }
}

/**
 * Every finding on the shelf, skill by skill and rule by rule.
 * @param {Shelf} shelf
 * @param {Options} [options]
 * @returns {Finding[]}
 */
export function inspectShelf(shelf, options = {}) {
  /** @type {Finding[]} */
  const findings = [];
  for (const name of options.only ?? [...shelf.keys()]) {
    /** @type {Finding[]} */
    const own = [];
    /** @type {Add} */
    const add = (rule, file, line, message, fix) => {
      own.push({ skill: name, rule, file, line, message, fix });
    };
    named(shelf, name, add);
    small(shelf, name, add);
    pointers(shelf, name, add);
    citations(shelf, name, add);
    tested(shelf, name, add, options);
    findings.push(...own.sort((a, b) => RULES.indexOf(a.rule) - RULES.indexOf(b.rule)));
  }
  return findings;
}
