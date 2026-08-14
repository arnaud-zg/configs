import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { InstalledPackage } from "./installed-package.value-object.mjs";

const require = createRequire(import.meta.url);
const startDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * A package's installed version, without executing it. Tries `<name>/package.json` first, then
 * falls back to a directory walk for packages that block that path via "exports" (e.g. remark-cli).
 * @param {string} name
 * @returns {InstalledPackage}
 */
export function resolveInstalledPackage(name) {
  const version = tryRequirePackageJson(name) ?? tryWalkNodeModules(name);
  return new InstalledPackage(name, version);
}

/** @param {string} name */
function tryRequirePackageJson(name) {
  try {
    return require(`${name}/package.json`).version;
  } catch {
    return undefined;
  }
}

/** @param {string} name */
function tryWalkNodeModules(name) {
  let dir = startDir;
  for (;;) {
    const version = tryReadVersionAt(path.join(dir, "node_modules", name, "package.json"));
    if (version !== undefined) return version;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** @param {string} packageJsonPath */
function tryReadVersionAt(packageJsonPath) {
  try {
    return JSON.parse(readFileSync(packageJsonPath, "utf8")).version;
  } catch {
    return undefined;
  }
}
