import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Linter } from "eslint";
import { ESLint } from "eslint";
import { afterEach, describe, expect, test } from "vitest";

import base from "./base.mjs";
import react from "./react.mjs";

const root = path.resolve(import.meta.dirname, "..");

describe("eslint/react", () => {
  test("is a valid, non-empty tseslint config that adds the react-hooks plugin", () => {
    expect(Array.isArray(react)).toBe(true);
    expect(react.length).toBeGreaterThan(base.length);
    const hasReactHooksPlugin = react.some(
      (entry) => entry.plugins && "react-hooks" in entry.plugins,
    );
    expect(hasReactHooksPlugin).toBe(true);
  });

  // Real lint run against the repo's own shipped tsconfig/react.json, proving the two actually
  // work together: a developer using both gets flagged for real accessibility and security
  // issues, not just a config object that happens to be non-empty.
  describe("catches real issues in JSX", () => {
    let tmpDir: string | undefined;

    afterEach(() => {
      if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = undefined;
    });

    test("missing alt text, click handler without keyboard support, target=_blank without rel", async () => {
      tmpDir = mkdtempSync(path.join(os.tmpdir(), "eslint-react-test-"));
      const tsconfigPath = path.join(tmpDir, "tsconfig.json");
      writeFileSync(
        tsconfigPath,
        JSON.stringify({
          extends: path.join(root, "tsconfig", "react.json"),
          include: ["fixture.tsx"],
        }),
      );
      const fixturePath = path.join(tmpDir, "fixture.tsx");
      writeFileSync(
        fixturePath,
        [
          "declare global {",
          "  namespace JSX {",
          "    interface IntrinsicElements {",
          "      div: Record<string, unknown>;",
          "      img: Record<string, unknown>;",
          "      a: Record<string, unknown>;",
          "    }",
          "    type Element = unknown;",
          "  }",
          "  const React: { createElement: (...args: unknown[]) => unknown };",
          "}",
          "",
          "export const App = () => (",
          "  <div onClick={() => {}}>",
          '    <img src="x.png" />',
          '    <a target="_blank" href="https://example.com">link</a>',
          "  </div>",
          ");",
          "",
        ].join("\n"),
      );

      const eslint = new ESLint({
        overrideConfigFile: true,
        baseConfig: [
          ...(react as unknown as Linter.Config[]),
          {
            languageOptions: {
              parserOptions: { project: [tsconfigPath], tsconfigRootDir: tmpDir },
            },
          },
        ],
        cwd: tmpDir,
      });
      const source = readFileSync(fixturePath, "utf8");
      const [result] = await eslint.lintText(source, { filePath: fixturePath });
      const ruleIds = (result?.messages ?? []).map((m) => m.ruleId);
      expect(ruleIds).toContain("jsx-a11y/alt-text");
      expect(ruleIds).toContain("jsx-a11y/click-events-have-key-events");
      expect(ruleIds).toContain("react/jsx-no-target-blank");
      // This fixture doesn't import React, relying on the automatic JSX runtime configured
      // by tsconfig/react.json's `"jsx": "react-jsx"`. react/react-in-jsx-scope assumes the
      // classic runtime and would false-positive here if the jsx-runtime config were missing.
      expect(ruleIds).not.toContain("react/react-in-jsx-scope");
    });
  });
});
