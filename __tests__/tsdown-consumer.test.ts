import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import pkg from "../package.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");

// `pnpm pack`'s tarball naming convention: scope's "@" dropped, "/" becomes "-".
const tarballName = `${pkg.name.replace(/^@/, "").replace("/", "-")}-${pkg.version}.tgz`;

let tmpDir: string | undefined;

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
});

describe("a real consumer installing the published package (integration)", () => {
  // `pnpm pack` runs this package's own "prepack" script first, which builds tsdown/base.ts the
  // same way `pnpm publish` would. Installing that tarball into a scratch project and building
  // against it — rather than importing tsdown/base.ts by relative path within this repo, the way
  // __tests__/tsdown.test.ts does — is what actually exercises the node_modules resolution a
  // downstream consumer hits. This is the path that broke: raw tsdown/base.ts published as the
  // "./tsdown" export can't be loaded from node_modules (unrun refuses to strip types there), so
  // the old test suite passed while every real consumer's build failed outright.
  test("can import and build against @arnaud-zg/configs/tsdown from node_modules", () => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "tsdown-consumer-"));

    execFileSync("pnpm", ["pack", "--pack-destination", tmpDir], { cwd: root, stdio: "pipe" });
    const tarballPath = path.join(tmpDir, tarballName);
    expect(existsSync(tarballPath)).toBe(true);

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

    // --offline: the exact versions requested above are already in this repo's own pnpm store
    // (they're this repo's own devDependencies), so no network access is needed and none is
    // implicitly relied on.
    execFileSync("pnpm", ["install", "--offline"], { cwd: consumerDir, stdio: "pipe" });
    execFileSync(path.join(consumerDir, "node_modules/.bin/tsdown"), {
      cwd: consumerDir,
      stdio: "pipe",
    });

    expect(existsSync(path.join(consumerDir, "dist", "index.js"))).toBe(true);
    expect(existsSync(path.join(consumerDir, "dist", "index.d.ts"))).toBe(true);
  }, 60_000);
});
