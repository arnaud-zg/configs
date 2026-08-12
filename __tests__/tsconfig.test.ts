import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const tscBin = path.join(root, "node_modules/.bin/tsc");

let tmpDir: string | undefined;

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
});

// Actually compiles a small fixture the way a developer's project would, then reports whether
// tsc accepted it, the way a developer would experience it (their build passes or fails).
function compile(variant: string, filename: string, source: string): { succeeded: boolean } {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), "tsconfig-test-"));
  const configPath = path.join(tmpDir, "tsconfig.json");
  writeFileSync(
    configPath,
    JSON.stringify({
      extends: path.join(root, "tsconfig", variant),
      include: [filename],
    }),
  );
  writeFileSync(path.join(tmpDir, filename), source);
  try {
    execFileSync(tscBin, ["-p", configPath], { cwd: tmpDir, stdio: "pipe" });
    return { succeeded: true };
  } catch {
    return { succeeded: false };
  }
}

const implicitAny = "export function greet(name) {\n  return `hello ${name}`;\n}\n";

describe("a developer relying on this package's type safety", () => {
  test("base.json catches an implicit any", () => {
    expect(compile("base.json", "index.ts", implicitAny).succeeded).toBe(false);
  });

  test("node.json intentionally allows it, for looser legacy Node code", () => {
    expect(compile("node.json", "index.ts", implicitAny).succeeded).toBe(true);
  });

  test("react.json still catches it (this is the fix: it now inherits base.json's strictness)", () => {
    expect(compile("react.json", "index.ts", implicitAny).succeeded).toBe(false);
  });
});

describe("a developer building a React app", () => {
  test("can write a JSX component under react.json", () => {
    // Self-contained JSX/React stub instead of the real `react` package: keeps this test
    // hermetic (no module resolution across a temp directory) while still proving the config's
    // actual promise, that a .tsx file with JSX syntax compiles under jsx: "react".
    const source = [
      "declare global {",
      "  namespace JSX {",
      "    interface IntrinsicElements {",
      "      div: Record<string, unknown>;",
      "    }",
      "    type Element = unknown;",
      "  }",
      "  const React: { createElement: (...args: unknown[]) => unknown };",
      "}",
      "",
      "export const App = () => <div>Hello</div>;",
      "",
    ].join("\n");
    expect(compile("react.json", "index.tsx", source).succeeded).toBe(true);
  });
});

describe("a developer building an internal library", () => {
  test("internal-package.json actually emits a .d.ts file", () => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "tsconfig-test-"));
    const configPath = path.join(tmpDir, "tsconfig.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        extends: path.join(root, "tsconfig", "internal-package.json"),
        include: ["index.ts"],
      }),
    );
    writeFileSync(path.join(tmpDir, "index.ts"), "export const answer = 42;\n");
    execFileSync(tscBin, ["-p", configPath], { cwd: tmpDir, stdio: "pipe" });
    expect(existsSync(path.join(tmpDir, "dist", "index.d.ts"))).toBe(true);
  });
});
