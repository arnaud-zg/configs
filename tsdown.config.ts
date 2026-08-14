import { defineLibraryConfig } from "./tsdown/base";

// Builds tsdown/base.ts with itself. This is what package.json's "./tsdown" export actually
// resolves to (dist/base.js + dist/base.d.ts). Raw TypeScript can't be published there because
// unrun (tsdown's config loader) refuses to strip types for files resolved under node_modules, so
// a consumer's tsdown.config.ts importing "@arnaud-zg/configs/tsdown" would fail outright. Runs
// automatically via the "prepack" script before `pnpm pack` / `pnpm publish`; the gitignored
// dist/ only exists after a build.
//
// exports: false. This package hand-maintains a multi-subpath exports map (eslint/prettier/
// tsconfig/tsdown/lefthook); the shared config's default `exports: { legacy: true }` would
// overwrite it with a single "." entry pointing at this smoke build's own dist/ output.
export default defineLibraryConfig({
  entry: ["tsdown/base.ts"],
  tsconfig: "tsconfig.json",
  exports: false,
});
