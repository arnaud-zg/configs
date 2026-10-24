// Finds skills on disk and reads them into the shelf `rules.mjs` inspects.
//
// A skill is a folder with a SKILL.md. A shelf is the folder that holds skills side by side,
// which is where a skill's `../<sibling>/` pointers land. Links are followed, because installers
// often link a skill into place rather than copy it.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Where skills live by convention, from a project's root. */
export const PLACES = [".claude/skills", ".agents/skills", "skills", "plugins/*/skills"];

const SKIPPED = new Set(["node_modules", ".git"]);
const LARGEST = 1024 * 1024;

/** @typedef {{ dir: string, skills: string[], only: string[] | null }} Place */

const isDir = (/** @type {string} */ path) => existsSync(path) && statSync(path).isDirectory();
const isSkill = (/** @type {string} */ dir) => existsSync(join(dir, "SKILL.md"));
const posixOf = (/** @type {string} */ path) => path.split(sep).join("/");

/** The skills directly inside a folder, by name, sorted. */
function skillsIn(/** @type {string} */ dir) {
  return readdirSync(dir)
    .filter((name) => isDir(join(dir, name)) && isSkill(join(dir, name)))
    .sort();
}

/** The conventional places under a root that hold at least one skill. */
function conventional(/** @type {string} */ root) {
  return PLACES.flatMap((place) => {
    if (!place.includes("*")) return [join(root, place)];
    const [parent = "", child = ""] = place.split("/*/");
    const base = join(root, parent);
    return isDir(base)
      ? readdirSync(base)
          .sort()
          .map((name) => join(base, name, child))
      : [];
  }).filter((dir) => isDir(dir) && skillsIn(dir).length > 0);
}

/**
 * Where to look for a path given on the command line, or for the conventional places when none
 * is. A skill's own folder is read with its shelf, so its siblings can still be pointed at.
 * @param {string} root
 * @param {string} [path]
 * @returns {Place[] | string} the places, or why there are none
 */
export function placesFor(root, path) {
  if (path === undefined) {
    const found = conventional(root).map((dir) => ({ dir, skills: skillsIn(dir), only: null }));
    return found.length > 0
      ? found
      : `No skills found. Looked in ${PLACES.join(", ")} under ${root}.\n` +
          "Pass the path of a skills folder, or of one skill.";
  }
  const dir = join(root, path);
  if (!existsSync(dir)) return `${path} does not exist.`;
  if (isSkill(dir)) {
    const shelf = join(dir, "..");
    const name = relative(shelf, dir);
    return [{ dir: shelf, skills: skillsIn(shelf), only: [name] }];
  }
  if (isDir(dir) && skillsIn(dir).length > 0) return [{ dir, skills: skillsIn(dir), only: null }];
  return `No skills in ${path}: a skill is a folder with a SKILL.md.`;
}

/** Every file under a folder, as a map of its posix path from there to its text. */
function filesUnder(/** @type {string} */ dir, root = dir, files = new Map()) {
  for (const name of readdirSync(dir)) {
    if (SKIPPED.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) filesUnder(path, root, files);
    else if (stat.size <= LARGEST)
      files.set(posixOf(relative(root, path)), readFileSync(path, "utf8"));
  }
  return files;
}

/**
 * The shelf at a place, as `rules.mjs` reads it.
 * @param {Place} place
 * @returns {Map<string, Map<string, string>>}
 */
export function readShelf(place) {
  return new Map(place.skills.map((name) => [name, filesUnder(join(place.dir, name))]));
}

/** A path from the root, written with forward slashes whatever the platform. */
export function fromRoot(/** @type {string} */ root, /** @type {string} */ path) {
  return posixOf(relative(root, path)) || ".";
}
