import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

import pkg from "./package.json" with { type: "json" };

const root = import.meta.dirname;

// `pnpm pack`'s tarball naming convention: scope's "@" dropped, "/" becomes "-".
const tarballName = `${pkg.name.replace(/^@/, "").replace("/", "-")}-${pkg.version}.tgz`;

let packDir: string | undefined;
let tarballPath: string;

beforeAll(() => {
  // Built once, shared read-only across every test below. Packing also rebuilds the repo's own
  // shared dist/, so this also caps that shared mutation at once instead of once per test.
  packDir = mkdtempSync(path.join(os.tmpdir(), "tsdown-consumer-pack-"));
  execFileSync("pnpm", ["pack", "--pack-destination", packDir], { cwd: root, stdio: "pipe" });
  tarballPath = path.join(packDir, tarballName);
  expect(existsSync(tarballPath)).toBe(true);
});

afterAll(() => {
  if (packDir) rmSync(packDir, { recursive: true, force: true });
});

let tmpDir: string | undefined;

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
});

// Pass `{ typescript: undefined }` to simulate a peer that was never installed. JSON.stringify
// drops undefined-valued keys.
function buildConsumer(devDependencyOverrides: Record<string, string | undefined> = {}): string {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), "tsdown-consumer-"));
  const consumerDir = path.join(tmpDir, "consumer");
  mkdirSync(path.join(consumerDir, "src"), { recursive: true });
  writeFileSync(
    path.join(consumerDir, "package.json"),
    JSON.stringify({
      name: "consumer",
      private: true,
      type: "module",
      devDependencies: {
        "@arnaud-zg/configs": `file:${tarballPath}`,
        tsdown: pkg.devDependencies.tsdown,
        typescript: pkg.devDependencies.typescript,
        ...devDependencyOverrides,
      },
    }),
  );
  writeFileSync(
    path.join(consumerDir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { module: "esnext", moduleResolution: "bundler", target: "es2022" },
      include: ["src"],
    }),
  );
  writeFileSync(path.join(consumerDir, "src", "index.ts"), "export const answer = 42;\n");
  writeFileSync(
    path.join(consumerDir, "tsdown.config.ts"),
    [
      'import { defineLibraryConfig } from "@arnaud-zg/configs/tsdown";',
      "",
      "export default defineLibraryConfig({",
      '  entry: ["src/index.ts"],',
      '  tsconfig: "tsconfig.json",',
      "  exports: false,",
      "});",
      "",
    ].join("\n"),
  );
  // --offline: these are already this repo's own devDependencies, already in the local store.
  execFileSync("pnpm", ["install", "--offline"], { cwd: consumerDir, stdio: "pipe" });
  return consumerDir;
}

function runTsdown(consumerDir: string): { stdout: string; stderr: string } | undefined {
  try {
    execFileSync(path.join(consumerDir, "node_modules/.bin/tsdown"), {
      cwd: consumerDir,
      stdio: "pipe",
    });
    return undefined;
  } catch (error) {
    const { stdout, stderr } = error as { stdout: Buffer; stderr: Buffer };
    return { stdout: stdout.toString(), stderr: stderr.toString() };
  }
}

// The top-level node_modules/typescript is the wrong place to doctor: pnpm gives
// @arnaud-zg/configs its own isolated typescript symlink (under node_modules/.pnpm/...) to keep
// its declared peer consistent, and dist/base.js resolves through that real location, not the
// top-level one. Replacing the symlink, rather than editing through it, avoids mutating the
// shared content-addressable store other projects on this machine also reference.
function makeConfigsOwnTypescriptIncompatible(consumerDir: string): void {
  const configsRealDir = realpathSync(
    path.join(consumerDir, "node_modules", "@arnaud-zg", "configs"),
  );
  const typescriptDir = path.join(path.dirname(path.dirname(configsRealDir)), "typescript");
  expect(
    lstatSync(typescriptDir).isSymbolicLink(),
    "expected pnpm to give @arnaud-zg/configs its own typescript symlink satisfying its peer",
  ).toBe(true);
  rmSync(typescriptDir);
  mkdirSync(typescriptDir);
  writeFileSync(
    path.join(typescriptDir, "package.json"),
    JSON.stringify({ name: "typescript", version: "1.0.0" }),
  );
}

describe("a real consumer installing the published package (end to end)", () => {
  // Installing the real tarball and building against it exercises node_modules resolution a
  // relative import within this repo wouldn't catch: raw tsdown/base.ts published as "./tsdown"
  // can't load from node_modules (unrun refuses to strip types there).
  test("can import and build against @arnaud-zg/configs/tsdown from node_modules", () => {
    const consumerDir = buildConsumer();
    const failure = runTsdown(consumerDir);

    expect(failure).toBeUndefined();
    expect(existsSync(path.join(consumerDir, "dist", "index.js"))).toBe(true);
    expect(existsSync(path.join(consumerDir, "dist", "index.d.ts"))).toBe(true);
  }, 60_000);

  // typescript is only needed once tsdown's dts plugin runs, so without PeerRequirementList a
  // missing typescript used to fail deep inside rolldown-plugin-dts instead of naming the peer.
  test("fails with a clear peer-dependency message, not tsdown's own dts error, when typescript is missing", () => {
    const consumerDir = buildConsumer({ typescript: undefined });
    const failure = runTsdown(consumerDir);

    expect(failure, "expected the build to fail without typescript installed").toBeDefined();
    const output = `${failure?.stdout}\n${failure?.stderr}`;
    expect(output).toContain("@arnaud-zg/configs/tsdown is missing required peer dependencies");
    expect(output).toContain("typescript");
    expect(output).toContain(pkg.peerDependencies.typescript);
  }, 60_000);

  // Companion to the missing-typescript case: a version mismatch, not an unresolved package.
  test("fails naming an installed-but-incompatible typescript version, not tsdown's own dts error", () => {
    const consumerDir = buildConsumer();
    makeConfigsOwnTypescriptIncompatible(consumerDir);
    const failure = runTsdown(consumerDir);

    expect(
      failure,
      "expected the build to fail with an incompatible typescript version",
    ).toBeDefined();
    const output = `${failure?.stdout}\n${failure?.stderr}`;
    expect(output).toContain("@arnaud-zg/configs/tsdown is missing required peer dependencies");
    expect(output).toContain(
      `typescript  1.0.0 installed, needs ${pkg.peerDependencies.typescript}`,
    );
  }, 60_000);
});

describe("the published tarball", () => {
  test("never contains test files", () => {
    const entries = execFileSync("tar", ["-tzf", tarballPath], { encoding: "utf8" });
    expect(entries).not.toMatch(/\.test\.ts$/m);
  });
});
