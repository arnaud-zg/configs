# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/).

Before running `pnpm version`, move the entries below out of `[Unreleased]` into a new dated section
for that version.

<!-- Keep a Changelog's `## [x.y.z]` headings read as CommonMark reference-link syntax to a strict
parser; remark-lint's no-undefined-references rule would otherwise flag every version heading below. -->
<!--lint disable no-undefined-references-->

## [Unreleased]

### Added

- `@arnaud-zg/configs/remark`: remark-lint's recommended preset, for a `.remarkrc.mjs` that lints
  Markdown. Dogfooded in this repo (`pnpm lint:md`).
- `@arnaud-zg/configs/commitlint`: `@commitlint/config-conventional` plus a mandatory scope, for a
  `commitlint.config.mjs`.

### Changed

- `lefthook/lefthook.yml`'s `commit-msg` hook now runs `pnpm exec commitlint --edit {1}` instead of
  a hand-rolled shell script, so it needs a `commitlint.config.mjs` in the consuming project
  (extending `@arnaud-zg/configs/commitlint` or `@commitlint/config-conventional` directly) — see
  [how-to.md](./docs/how-to.md#enforce-conventional-commits).

### Removed

- **Breaking:** `@arnaud-zg/configs/lefthook/check-commit-msg.sh`, replaced by commitlint (see
  Changed above).

## [0.1.3] - 2026-08-12

### Fixed

- `./tsdown` now resolves to a built `dist/base.js` instead of raw `tsdown/base.ts`. Publishing it
  as source broke every consumer: the file is loaded directly by tsdown's own config loader
  (`unrun`) when a `tsdown.config.ts` does
  `import { defineLibraryConfig } from "@arnaud-zg/configs/tsdown"`, and Node's
  `--experimental-strip-types` refuses to strip types for files resolved under `node_modules`, so
  the import failed outright for every real consumer.

## [0.1.2] - 2026-08-12

### Fixed

- `eslint/react.mjs` now includes eslint-plugin-react's `jsx-runtime` config alongside
  `recommended`. Without it, `react/react-in-jsx-scope` and `react/jsx-uses-react` false-positive on
  every JSX file in projects using the automatic runtime (React 17+), which is the default for
  virtually all current React/React Native/Expo projects.

### Changed

- Migrated `eslint/base.mjs`, `eslint/react.mjs`, and `eslint.config.mjs` off the deprecated
  `tseslint.config()` helper onto ESLint core's `defineConfig()`. As part of this, `no-undef` is now
  explicitly set to `"off"` in the shared ruleset rather than relying on a `tseslint.config()` quirk
  that had been silently disabling it for `.js`/`.mjs`/`.cjs` files (behavior is unchanged, just
  made explicit).

## [0.1.1] - 2026-08-12

### Fixed

- Include `docs/` in the published npm package so the Diataxis guides (and the README links to them)
  resolve from an installed package, not just the GitHub repo.

## [0.1.0] - 2026-08-12

### Added

- ESLint 9 flat config: framework-agnostic base plus an optional React variant (React, React Hooks,
  and JSX accessibility rules).
- Prettier configuration: import sorting, canonical `package.json` key ordering, Tailwind-friendly
  overrides, per-filetype rules.
- Shared `tsconfig.json` bases: Node, React, React Native, and their Vite/Vitest/Storybook
  combinations.
- Shared [tsdown](https://tsdown.dev) build defaults for libraries.
- Shared [Lefthook](https://lefthook.dev) base: protect `main`, format staged files, enforce
  Conventional Commits.
