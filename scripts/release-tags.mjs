/**
 * Tag a release after `changeset publish`.
 *
 * `changeset publish` runs with `--no-git-tag`, because its monorepo tag format
 * (`@arnaud-zg/configs@0.3.1`) matches neither convention this repository needs:
 *
 *   - the npm package is tagged `v<version>`, annotated, carrying its changelog entry;
 *   - each plugin is tagged `<name>--v<version>` by `claude plugin tag`, which also checks that
 *     plugin.json and the marketplace entry agree before tagging.
 *
 * Run as part of `pnpm release`, never on its own. Tags are created locally; push them yourself
 * after checking them.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const run = (file, args) => {
  try {
    return execFileSync(file, args, { cwd: root, stdio: "pipe" }).toString().trim();
  } catch (error) {
    // execFileSync throws with the child's output attached as Buffers. Surface it: the useful
    // message ("uncommitted changes affecting this release") comes from the child, not from here.
    const output = [error.stdout, error.stderr]
      .map((buffer) => buffer?.toString().trim())
      .filter(Boolean);
    throw new Error([`${file} ${args.join(" ")} failed`, ...output].join("\n"));
  }
};

const tagExists = (tag) => {
  try {
    run("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`]);
    return true;
  } catch {
    return false;
  }
};

// 1. The npm package: v<version>, annotated with its changelog section.
const version = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
const tag = `v${version}`;

if (tagExists(tag)) {
  console.info(`  ${tag} already exists, skipping`);
} else {
  const changelog = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  const section = changelog.split(`\n## ${version}\n`)[1]?.split("\n## ")[0]?.trim();
  if (!section) {
    console.error(`No CHANGELOG.md section found for ${version}. Did \`changeset version\` run?`);
    process.exit(1);
  }
  run("git", ["tag", "-a", tag, "-m", tag, "-m", section]);
  console.info(`  ${tag}`);
}

// 2. Each plugin: <name>--v<version>, via the CLI so manifest agreement is checked.
const pluginsDir = path.join(root, "plugins");
for (const entry of readdirSync(pluginsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const pluginDir = path.join(pluginsDir, entry.name);
  if (!existsSync(path.join(pluginDir, "package.json"))) continue;

  const manifest = JSON.parse(
    readFileSync(path.join(pluginDir, ".claude-plugin", "plugin.json"), "utf8"),
  );
  const pluginTag = `${manifest.name}--v${manifest.version}`;
  if (tagExists(pluginTag)) {
    console.info(`  ${pluginTag} already exists, skipping`);
    continue;
  }
  run("claude", ["plugin", "tag", path.relative(root, pluginDir)]);
  console.info(`  ${pluginTag}`);
}

console.info("\nReview the tags, then: git push --follow-tags");
