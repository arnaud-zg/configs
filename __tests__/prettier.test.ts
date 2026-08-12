import * as prettier from "prettier";
import { describe, expect, test } from "vitest";

import config from "../prettier/index.js";

describe("prettier", () => {
  test("sorts imports: node builtins, then react, then third-party, then relative", async () => {
    const source = [
      'import { z } from "zod";',
      'import fs from "node:fs";',
      'import React from "react";',
      'import { local } from "./local";',
      "",
      "React.createElement(fs, z, local);",
      "",
    ].join("\n");

    const output = await prettier.format(source, { ...config, filepath: "fixture.ts" });

    const fsIndex = output.indexOf('from "node:fs"');
    const reactIndex = output.indexOf('from "react"');
    const zodIndex = output.indexOf('from "zod"');
    const localIndex = output.indexOf('from "./local"');

    expect(fsIndex).toBeGreaterThan(-1);
    expect(fsIndex).toBeLessThan(reactIndex);
    expect(reactIndex).toBeLessThan(zodIndex);
    expect(zodIndex).toBeLessThan(localIndex);
  });

  test("uses double quotes and a trailing comma on wrapped lines", async () => {
    const source =
      'const items = ["aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb", "cccccccccccccccc", "dddddddddddddddd", "eeeeeeeeeeeeeeee"];\n';
    const output = await prettier.format(source, { ...config, filepath: "fixture.ts" });
    expect(output).toContain('"aaaaaaaaaaaaaaaa",\n');
    expect(output).not.toMatch(/'/);
  });

  test("is idempotent", async () => {
    const once = await prettier.format('import React from "react";\nReact.createElement();\n', {
      ...config,
      filepath: "fixture.ts",
    });
    const twice = await prettier.format(once, { ...config, filepath: "fixture.ts" });
    expect(twice).toBe(once);
  });
});
