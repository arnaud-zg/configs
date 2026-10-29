/**
 * `pnpm release:version` — open the release PR.
 *
 * Applies every pending changeset on a new `release/` branch and opens a PR for it. `main` is
 * protected, so versions only reach it through that PR. After the merge, `pnpm release` publishes
 * and tags.
 */
import { readdirSync } from "node:fs";
import path from "node:path";

import { readJson, root, run, runVisible, startFromMain } from "./release-shared.mjs";

startFromMain();

const pending = readdirSync(path.join(root, ".changeset")).filter(
  (file) => file.endsWith(".md") && file !== "README.md",
);
if (pending.length === 0) {
  console.info("No pending changesets, so nothing to version. Add one with `pnpm changeset`.");
  process.exit(0);
}

// The package.json version changesets bumps.
const versions = () => new Map([[readJson("package.json").name, readJson("package.json").version]]);

// Branch first, so a step that fails below leaves its changes here rather than on main.
const branch = `release/${new Date().toISOString().slice(0, 19).replace("T", "-").replaceAll(":", "")}`;
run("git", ["switch", "-c", branch]);

const before = versions();
runVisible("pnpm", ["exec", "changeset", "version"]);
runVisible("node", ["scripts/sync-versions.mjs"]);
runVisible("pnpm", ["install", "--lockfile-only"]);

const bumps = [...versions()]
  .filter(([name, version]) => before.get(name) !== version)
  .map(([name, version]) => `- ${name}: ${before.get(name)} → ${version}`)
  .join("\n");

const title = "chore(release): version packages";
run("git", ["add", "--all"]);
run("git", ["commit", "-m", title, "-m", bumps || "No version changes."]);
run("git", ["push", "-u", "origin", branch]);
const url = run("gh", [
  "pr",
  "create",
  "--base",
  "main",
  "--head",
  branch,
  "--title",
  title,
  "--body",
  `${bumps || "No version changes."}\n\nAfter merging, run \`pnpm release\`.`,
]);

console.info(`\n${bumps}\n\nRelease PR: ${url}\nAfter merging it, run \`pnpm release\`.`);
