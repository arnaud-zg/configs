# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/).

Before running `pnpm version`, move the entries below out of `[Unreleased]` into a new dated section
for that version.

## [Unreleased]

### Added

- ESLint 9 flat config: framework-agnostic base plus an optional React variant (React, React
  Hooks, and JSX accessibility rules).
- Prettier configuration: import sorting, canonical `package.json` key ordering,
  Tailwind-friendly overrides, per-filetype rules.
- Shared `tsconfig.json` bases: Node, React, React Native, and their Vite/Vitest/Storybook
  combinations.
