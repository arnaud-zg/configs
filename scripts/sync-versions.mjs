/**
 * Propagate versions after `changeset version`.
 *
 * Changesets owns `package.json` versions and changelogs. It knows nothing about the two other
 * places a version has to appear in this repository:
 *
 *   - each plugin's `.claude-plugin/plugin.json`, and that plugin's entry in the marketplace
 *     catalogue — `claude plugin tag` refuses to tag when the two disagree;
 *   - the pinned `@arnaud-zg/configs@x.y.z` install examples in the docs, so they never recommend
 *     a version older than the one being released.
 *
 * Run as part of `pnpm release:version`, never on its own.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const changed = [];

// 1. The npm package version, into every pinned install example.
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

// 2. Each plugin's package.json version, into its plugin manifest and marketplace entry.
const pluginsDir = path.join(root, "plugins");
const marketplacePath = path.join(root, ".claude-plugin", "marketplace.json");
const marketplace = readJson(marketplacePath);
let marketplaceChanged = false;

const pluginDirs = readdirSync(pluginsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const name of pluginDirs) {
  const packageJsonPath = path.join(pluginsDir, name, "package.json");
  const manifestPath = path.join(pluginsDir, name, ".claude-plugin", "plugin.json");

  let version;
  try {
    version = readJson(packageJsonPath).version;
  } catch {
    // A plugin without a package.json is outside the changesets flow; leave it alone.
    continue;
  }

  const manifest = readJson(manifestPath);
  if (manifest.version !== version) {
    manifest.version = version;
    writeJson(manifestPath, manifest);
    changed.push(`plugins/${name}/.claude-plugin/plugin.json → ${version}`);
  }

  const entry = marketplace.plugins.find((plugin) => plugin.name === manifest.name);
  if (entry && "version" in entry && entry.version !== version) {
    entry.version = version;
    marketplaceChanged = true;
    changed.push(`marketplace entry ${manifest.name} → ${version}`);
  }
}

if (marketplaceChanged) writeJson(marketplacePath, marketplace);

console.info(changed.length ? changed.map((line) => `  ${line}`).join("\n") : "  nothing to sync");
