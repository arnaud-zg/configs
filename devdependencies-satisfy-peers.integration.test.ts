import { describe, expect, test } from "vitest";

import commitlintConfig from "./commitlint/index.mjs";
import eslintBase from "./eslint/base.mjs";
import eslintReact from "./eslint/react.mjs";
import prettierConfig from "./prettier/index.js";
import remarkDocs from "./remark/docs.mjs";
import remarkBase from "./remark/index.mjs";
import { defineLibraryConfig } from "./tsdown/base";

// Each import above already ran that subpath's PeerRequirementList#assertSatisfied() as a side
// effect. If this repo's own devDependencies ever drift from what it declares in
// peerDependencies, the import throws and this file fails. Other tests import these files too,
// but for behavior, not for this guarantee; this file's only job is to make it explicit.
describe("this repo's own devDependencies satisfy every subpath's declared peers", () => {
  test.each([
    ["eslint/base.mjs", eslintBase],
    ["eslint/react.mjs", eslintReact],
    ["prettier/index.js", prettierConfig],
    ["commitlint/index.mjs", commitlintConfig],
    ["remark/index.mjs", remarkBase],
    ["remark/docs.mjs", remarkDocs],
    ["tsdown/base.ts's defineLibraryConfig", defineLibraryConfig],
  ])("%s imported cleanly against this repo's own devDependencies", (_label, value) => {
    expect(value).toBeDefined();
  });
});
