/**
 * Propagate versions after `changeset version`.
 *
 * Changesets owns `package.json` versions and changelogs. It knows nothing about the pinned
 * `@arnaud-zg/configs@x.y.z` install examples in the docs, which this keeps from recommending a
 * version older than the one being released.
 *
 * Run as part of `pnpm release:version`, never on its own.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const changed = [];

const packageVersion = readJson(path.join(root, "package.json")).version;
const pinned = /@arnaud-zg\/configs@\d+\.\d+\.\d+/g;

for (const file of ["README.md", "docs/tutorial.md"]) {
  const absolute = path.join(root, file);
  const before = readFileSync(absolute, "utf8");
  const after = before.replaceAll(pinned, `@arnaud-zg/configs@${packageVersion}`);
  if (before !== after) {
    writeFileSync(absolute, after);
    changed.push(`${file} → @arnaud-zg/configs@${packageVersion}`);
  }
}

console.info(changed.length ? changed.map((line) => `  ${line}`).join("\n") : "  nothing to sync");
