import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const root = import.meta.dirname;
const pluginsDir = path.join(root, "plugins");

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8")) as Record<string, string>;

const pluginDirs = readdirSync(pluginsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const marketplace = readJson(path.join(root, ".claude-plugin", "marketplace.json")) as unknown as {
  plugins: { name: string; source: string }[];
};

// The plugin template is copied into plugins/ to start a new plugin, and every field in it has to
// be renamed by hand. Forgetting the package.json rename is silent: changesets would version a
// plugin under the template's name, or skip it entirely. These checks make that a test failure.
describe("a plugin added to the marketplace", () => {
  test("has a package.json named after its directory, so changesets can version it", () => {
    for (const name of pluginDirs) {
      const packageJsonPath = path.join(pluginsDir, name, "package.json");
      expect(existsSync(packageJsonPath), `plugins/${name} has no package.json`).toBe(true);
      expect(readJson(packageJsonPath).name).toBe(`@arnaud-zg/plugin-${name}`);
    }
  });

  test("is private, so `changeset publish` never pushes it to npm", () => {
    for (const name of pluginDirs) {
      expect(readJson(path.join(pluginsDir, name, "package.json")).private).toBe(true);
    }
  });

  test("has a plugin manifest whose name matches its directory", () => {
    for (const name of pluginDirs) {
      const manifest = readJson(path.join(pluginsDir, name, ".claude-plugin", "plugin.json"));
      expect(manifest.name).toBe(name);
    }
  });

  test("carries the same version in package.json and plugin.json", () => {
    // Changesets bumps package.json and writes the changelog against it; Claude Code installs and
    // `claude plugin tag` tags whatever plugin.json says. scripts/sync-versions.mjs copies one into
    // the other during `pnpm release:version`, so a mismatch means the sync step was skipped.
    for (const name of pluginDirs) {
      const pkg = readJson(path.join(pluginsDir, name, "package.json"));
      const manifest = readJson(path.join(pluginsDir, name, ".claude-plugin", "plugin.json"));
      expect(manifest.version, `plugins/${name} versions disagree`).toBe(pkg.version);
    }
  });

  test("is listed in the marketplace catalogue, and nothing is listed that isn't there", () => {
    expect([...pluginDirs].sort()).toEqual([...marketplace.plugins.map((p) => p.name)].sort());
  });

  test("keeps its version out of the catalogue entry, so plugin.json is the only place it lives", () => {
    // Claude Code reads plugin.json's version before the entry's, so a version here is ignored at
    // install time and can only go stale — and a stale one makes `claude plugin tag` refuse to tag.
    for (const entry of marketplace.plugins) {
      expect(entry, `marketplace entry ${entry.name} has a version`).not.toHaveProperty("version");
    }
  });
});

describe("the plugin template", () => {
  test("stays outside plugins/, so it is never versioned, tagged or listed", () => {
    expect(pluginDirs).not.toContain("plugin-template");
    expect(existsSync(path.join(root, "templates", "plugin-template", "package.json"))).toBe(true);
  });
});
