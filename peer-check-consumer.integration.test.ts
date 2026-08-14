import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import pkg from "./package.json" with { type: "json" };

const root = import.meta.dirname;
const peerDependencies = pkg.peerDependencies as Record<string, string>;

function rangeFor(name: string): string {
  const range = peerDependencies[name];
  if (!range) throw new Error(`no peerDependencies range declared for "${name}"`);
  return range;
}

let tmpDir: string | undefined;

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
});

// Stripping "^" from a caret range always satisfies that range, so this stays correct as ranges bump.
function satisfyingVersion(range: string): string {
  return range.replace(/^\^/, "");
}

// prettier/index.js is the cleanest subpath to test this way: none of its three peers are
// statically imported, so nothing but our own check can catch a problem here.
function buildFixture(installedPeers: Record<string, string | undefined>): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "peer-check-consumer-"));
  tmpDir = dir;

  cpSync(path.join(root, "internal"), path.join(dir, "internal"), { recursive: true });
  mkdirSync(path.join(dir, "prettier"));
  cpSync(path.join(root, "prettier", "index.js"), path.join(dir, "prettier", "index.js"));
  cpSync(path.join(root, "package.json"), path.join(dir, "package.json"));

  for (const [name, version] of Object.entries(installedPeers)) {
    if (!version) continue; // omitted entirely -> "not installed"
    const peerDir = path.join(dir, "node_modules", name);
    mkdirSync(peerDir, { recursive: true });
    writeFileSync(path.join(peerDir, "package.json"), JSON.stringify({ name, version }));
  }

  return dir;
}

async function messageFromImporting(entryFile: string): Promise<string> {
  try {
    await import(entryFile);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error(`expected importing ${entryFile} to throw`);
}

describe("importing @arnaud-zg/configs/prettier as a real consumer would", () => {
  test("throws naming a missing peer, its required range, and an install command", async () => {
    const dir = buildFixture({
      prettier: satisfyingVersion(rangeFor("prettier")),
      "@ianvs/prettier-plugin-sort-imports": satisfyingVersion(
        rangeFor("@ianvs/prettier-plugin-sort-imports"),
      ),
      // prettier-plugin-packagejson deliberately omitted.
    });

    const message = await messageFromImporting(path.join(dir, "prettier", "index.js"));
    expect(message).toContain("@arnaud-zg/configs/prettier is missing required peer dependencies");
    expect(message).toContain(
      `prettier-plugin-packagejson  not installed (needs ${rangeFor("prettier-plugin-packagejson")})`,
    );
    expect(message).toContain(
      `pnpm add -D prettier@${rangeFor("prettier")} @ianvs/prettier-plugin-sort-imports@${rangeFor("@ianvs/prettier-plugin-sort-imports")} prettier-plugin-packagejson@${rangeFor("prettier-plugin-packagejson")}`,
    );
  });

  test("throws naming an installed peer's version when it doesn't satisfy the required range", async () => {
    const dir = buildFixture({
      prettier: satisfyingVersion(rangeFor("prettier")),
      "@ianvs/prettier-plugin-sort-imports": satisfyingVersion(
        rangeFor("@ianvs/prettier-plugin-sort-imports"),
      ),
      // A version too low to satisfy any real ^-range declared for it.
      "prettier-plugin-packagejson": "0.0.1",
    });

    const message = await messageFromImporting(path.join(dir, "prettier", "index.js"));
    expect(message).toContain(
      `prettier-plugin-packagejson  0.0.1 installed, needs ${rangeFor("prettier-plugin-packagejson")}`,
    );
  });

  test("does not throw when every peer is installed and satisfies its range", async () => {
    const dir = buildFixture({
      prettier: satisfyingVersion(rangeFor("prettier")),
      "@ianvs/prettier-plugin-sort-imports": satisfyingVersion(
        rangeFor("@ianvs/prettier-plugin-sort-imports"),
      ),
      "prettier-plugin-packagejson": satisfyingVersion(rangeFor("prettier-plugin-packagejson")),
    });

    await expect(import(path.join(dir, "prettier", "index.js"))).resolves.toBeDefined();
  });
});
