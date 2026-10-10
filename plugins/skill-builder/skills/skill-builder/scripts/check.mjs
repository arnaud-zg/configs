#!/usr/bin/env node
// Checks skills against the four rules in rules.mjs and prints every finding with its file,
// line and fix. It needs Node only, and changes nothing.
//
//   node check.mjs [path ...] [--suite <package.json script>] [--json]
//
// Exit 0 when every skill holds, 1 when one does not, 2 when there is nothing to check.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { inspectShelf, RULES } from "./rules.mjs";
import { fromRoot, placesFor, readShelf } from "./shelf.mjs";

const USAGE = `Usage: node check.mjs [path ...] [--suite <script>] [--json]

  path            a skills folder, or one skill's folder. Without one, it looks in
                  .claude/skills, .agents/skills, skills and plugins/*/skills
  --suite <name>  also require every test to be named in that package.json script
  --json          print the findings as JSON

Exit 0 when every skill holds, 1 when one does not, 2 when there is nothing to check.`;

/** @typedef {import("./rules.mjs").Finding & { path: string }} Located */

const colour =
  (process.env.FORCE_COLOR ?? "") !== "" && process.env.FORCE_COLOR !== "0"
    ? true
    : process.stdout.isTTY && (process.env.NO_COLOR ?? "") === "";
const paint = (/** @type {number} */ code) => (/** @type {string} */ text) =>
  colour ? `\u001b[${String(code)}m${text}\u001b[0m` : text;
const [green, red, dim, bold] = [paint(32), paint(31), paint(2), paint(1)];
const plural = (/** @type {number} */ count, /** @type {string} */ word) =>
  `${String(count)} ${word}${count === 1 ? "" : "s"}`;

/** Prints a line to stdout, where a report belongs. */
const say = (text = "") => {
  process.stdout.write(`${text}\n`);
};

/** @param {string} message @returns {never} */
function stop(message) {
  console.error(message);
  process.exit(2);
}

/** @param {string[]} args */
function parse(args) {
  /** @type {{ paths: string[], suiteName: string | null, json: boolean }} */
  const parsed = { paths: [], suiteName: null, json: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? "";
    if (arg === "--help" || arg === "-h") {
      say(USAGE);
      process.exit(0);
    }
    if (arg === "--json") parsed.json = true;
    else if (arg === "--suite") parsed.suiteName = args[++index] ?? stop(USAGE);
    else if (arg.startsWith("-")) stop(`Unknown option ${arg}.\n\n${USAGE}`);
    else parsed.paths.push(arg);
  }
  return parsed;
}

/** The words of a package.json script, which name the tests it runs. */
function suiteOf(/** @type {string} */ root, /** @type {string} */ name) {
  const manifest = join(root, "package.json");
  if (!existsSync(manifest)) stop(`--suite reads package.json, and ${root} has none.`);
  const scripts = /** @type {{ scripts?: Record<string, string> }} */ (
    JSON.parse(readFileSync(manifest, "utf8"))
  ).scripts;
  const script = scripts?.[name];
  if (script === undefined) stop(`package.json has no "${name}" script.`);
  return script.split(/\s+/);
}

/** @param {string} root @param {ReturnType<typeof parse>} options */
function inspect(root, options) {
  const suite = options.suiteName === null ? null : suiteOf(root, options.suiteName);
  const places = (options.paths.length > 0 ? options.paths : [undefined]).flatMap((path) => {
    const found = placesFor(root, path);
    return typeof found === "string" ? stop(found) : found;
  });
  return places.map((place) => {
    const pathOf = (/** @type {string} */ skill) => fromRoot(root, join(place.dir, skill));
    const findings = inspectShelf(readShelf(place), {
      suite,
      suiteName: options.suiteName ?? undefined,
      pathOf,
      only: place.only ?? undefined,
    }).map((finding) => ({ ...finding, path: `${pathOf(finding.skill)}/${finding.file}` }));
    return {
      shelf: fromRoot(root, place.dir),
      skills: place.only ?? place.skills,
      pathOf,
      findings,
    };
  });
}

/** @param {ReturnType<typeof inspect>} shelves */
function print(shelves) {
  const total = shelves.reduce((sum, shelf) => sum + shelf.skills.length, 0);
  say(`Checking ${plural(total, "skill")} against ${RULES.join(", ")}\n`);
  for (const shelf of shelves) {
    say(dim(shelf.shelf));
    for (const skill of shelf.skills) {
      const own = shelf.findings.filter((finding) => finding.skill === skill);
      say(own.length === 0 ? `  ${green("✓")} ${skill}` : `  ${red("✗")} ${bold(skill)}`);
      for (const finding of own) {
        say(`      ${bold(`${finding.path}:${String(finding.line)}`)}  ${dim(finding.rule)}`);
        say(`      ${finding.message}`);
        say(`      ${dim("→")} ${finding.fix}`);
      }
    }
    say();
  }
  const findings = shelves.flatMap((shelf) => shelf.findings);
  const broken = new Set(
    shelves.flatMap((shelf) => shelf.findings.map((finding) => shelf.pathOf(finding.skill))),
  );
  say(
    findings.length === 0
      ? green(`✓ ${plural(total, "skill")} ${total === 1 ? "holds" : "hold"} all four rules.`)
      : red(
          `✗ ${plural(findings.length, "finding")} in ${String(broken.size)} of ${plural(total, "skill")}.`,
        ),
  );
}

const options = parse(process.argv.slice(2));
const shelves = inspect(process.cwd(), options);
const findings = shelves.flatMap((shelf) => shelf.findings);

if (options.json) {
  const skills = shelves.flatMap((shelf) =>
    shelf.skills.map((name) => ({ name, path: shelf.pathOf(name) })),
  );
  say(JSON.stringify({ skills, findings }, null, 2));
} else {
  print(shelves);
}

process.exit(findings.length === 0 ? 0 : 1);
