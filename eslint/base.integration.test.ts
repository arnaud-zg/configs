import type { Linter } from "eslint";
import { ESLint } from "eslint";
import { describe, expect, test } from "vitest";

import base from "./base.mjs";

const baseConfig = base as unknown as Linter.Config[];

describe("eslint/base", () => {
  const eslint = new ESLint({ overrideConfigFile: true, baseConfig });

  async function lintFixture(source: string): Promise<ESLint.LintResult> {
    const result = (await eslint.lintText(source, { filePath: "fixture.js" })).at(0);
    if (!result) throw new Error("expected exactly one lint result");
    return result;
  }

  test("flags console.log but allows console.warn (no-console)", async () => {
    const result = await lintFixture('console.log("hi");\nconsole.warn("ok");\n');
    const ruleIds = result.messages.map((m) => m.ruleId);
    expect(ruleIds).toContain("no-console");
    expect(result.messages).toHaveLength(1);
  });

  test("stays silent on clean code", async () => {
    const result = await lintFixture('console.warn("ok");\n');
    expect(result.messages).toEqual([]);
  });

  test("does not enable stylistic rules that fight Prettier", async () => {
    // Single quotes and no trailing semicolon are both Prettier's job, not ESLint's.
    const result = await lintFixture("console.warn('ok')\n");
    const ruleIds = result.messages.map((m) => m.ruleId);
    expect(ruleIds.some((id) => id?.includes("quotes") || id?.includes("semi"))).toBe(false);
  });

  // Coarse smoke alarm, not a benchmark: catches an accidentally-added slow rule/plugin (e.g.
  // one that scans node_modules) without pretending to precisely measure lint performance.
  test("lints a small fixture within a generous time budget", async () => {
    const start = performance.now();
    await lintFixture('console.warn("ok");\n');
    expect(performance.now() - start).toBeLessThan(3000);
  });
});
