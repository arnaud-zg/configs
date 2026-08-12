import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";

// entry is required; every other tsdown option is an optional override on top of the shared
// defaults below — e.g. defineLibraryConfig({ entry: [...], sourcemap: false }).
type LibraryConfigOptions = { entry: UserConfig["entry"] } & Partial<Omit<UserConfig, "entry">>;

// Shared build config for libraries. publint/attw are deliberately NOT enabled here — consumers
// wanting that validation can enable them themselves via `overrides`.
export const defineLibraryConfig = ({ entry, ...overrides }: LibraryConfigOptions) =>
  defineConfig({
    entry,
    format: ["esm"],
    // Node platform defaults fixedExtension to true (.mjs) — this package's exports map
    // expects .js (type: module), so opt back into the type-based extension.
    fixedExtension: false,
    // Dedicated tsconfig: the monorepo one trips up the isolated dts build.
    tsconfig: "tsconfig.build.json",
    dts: true,
    sourcemap: true,
    clean: true,
    // Auto-generates package.json's exports map (plus legacy main/module/types) from `entry` —
    // no more hand-maintaining a map that has to be kept in sync by hand.
    exports: { legacy: true },
    ...overrides,
  });
