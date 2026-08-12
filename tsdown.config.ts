import { defineLibraryConfig } from "./tsdown/base";

// Smoke-tests the shared tsdown config by building tsdown/base.ts with itself. Output goes to
// the gitignored dist/ — this is a self-check, not part of what gets published.
//
// exports: false — this package hand-maintains a multi-subpath exports map (eslint/prettier/
// tsconfig/tsdown/lefthook); the shared config's default `exports: { legacy: true }` would
// overwrite it with a single "." entry pointing at this smoke build's own dist/ output.
export default defineLibraryConfig({
  entry: ["tsdown/base.ts"],
  tsconfig: "tsconfig.json",
  exports: false,
});
