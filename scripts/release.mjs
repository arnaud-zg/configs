/**
 * `pnpm release` — publish, tag and announce whatever the merged release PR versioned.
 *
 * It works out what is new by itself: every current version — the npm package's and each
 * plugin's — that has no GitHub release yet. For each one it
 *
 *   - publishes to npm, for the package only; a plugin reached users when the release PR merged;
 *   - tags: `v<version>` for the package, annotated with its changelog section, and
 *     `<name>--v<version>` for a plugin, through `claude plugin tag`, which validates it first;
 *   - pushes the tag and creates the GitHub release, with the changelog section as its notes.
 *
 * `changeset publish` runs with `--no-git-tag`, because its monorepo tag format
 * (`@arnaud-zg/configs@0.3.1`) matches neither convention above. Every step is safe to repeat, so a
 * release that stopped halfway is finished by running `pnpm release` again.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  fail,
  plugins,
  readJson,
  root,
  run,
  runVisible,
  startFromMain,
  succeeds,
} from "./release-shared.mjs";

startFromMain();

// The section changesets wrote for this version.
const changelogSection = (dir, version) => {
  const file = path.join(root, dir, "CHANGELOG.md");
  if (!existsSync(file)) return undefined;
  return readFileSync(file, "utf8").split(`\n## ${version}\n`)[1]?.split("\n## ")[0]?.trim();
};

// One listing rather than a `gh release view` per tag: that fails the same way for "no such release"
// and "not logged in", and the second must stop the release rather than look like work to do.
const released = new Set(
  run("gh", ["release", "list", "--limit", "1000", "--json", "tagName", "--jq", ".[].tagName"])
    .split("\n")
    .filter(Boolean),
);

const { version } = readJson("package.json");
const releases = [
  { tag: `v${version}`, notes: changelogSection(".", version) },
  // A plugin at 0.0.0 has never been versioned: its first version comes from a changeset, through
  // `pnpm release:version`, like every later one. Until then there is nothing to release.
  ...plugins()
    .filter((plugin) => plugin.version !== "0.0.0")
    .map((plugin) => ({
      tag: `${plugin.name}--v${plugin.version}`,
      notes: changelogSection(plugin.dir, plugin.version),
      plugin,
    })),
].filter((release) => !released.has(release.tag));

if (releases.length === 0) {
  console.info("Nothing to release: every current version already has a GitHub release.");
  process.exit(0);
}

for (const { tag, notes } of releases) {
  if (!notes) fail(`No changelog section for ${tag}. Did the \`pnpm release:version\` PR merge?`);
}

if (releases.some((release) => !release.plugin)) {
  runVisible("pnpm", ["build"]);
  runVisible("pnpm", ["exec", "changeset", "publish", "--no-git-tag"]);
}

for (const { tag, notes, plugin } of releases) {
  if (succeeds("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`])) continue;
  if (plugin) run("claude", ["plugin", "tag", plugin.dir]);
  else run("git", ["tag", "-a", tag, "-m", tag, "-m", notes]);
}

run("git", ["push", "origin", ...releases.map(({ tag }) => `refs/tags/${tag}`)]);

for (const { tag, notes, plugin } of releases) {
  // A plugin release must not take "Latest" from the package's release on the repository page.
  const latest = plugin ? ["--latest=false"] : [];
  run("gh", [
    "release",
    "create",
    tag,
    "--verify-tag",
    "--title",
    tag,
    "--notes",
    notes,
    ...latest,
  ]);
  console.info(`  released ${tag}`);
}
