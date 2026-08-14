[🏠 Home](../README.md) · [🚀 Tutorial](./tutorial.md) · [🛠️ How-to](./how-to.md) · **📖 Reference**
· [💡 Explanation](./explanation.md)

# 📖 Reference

## Exports and peer dependencies

Every peer is optional; install only what your chosen subpath needs.

| Subpath                                    | Resolves to                                  | Required peers                                                                           |
| ------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `@arnaud-zg/configs/eslint`                | `eslint/base.mjs`                            | `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`                    |
| `@arnaud-zg/configs/eslint/react`          | `eslint/react.mjs`                           | above, plus `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks` |
| `@arnaud-zg/configs/prettier`              | `prettier/index.js`                          | `prettier`, `@ianvs/prettier-plugin-sort-imports`, `prettier-plugin-packagejson`         |
| `@arnaud-zg/configs/tsconfig/*.json`       | `tsconfig/*.json` (variants below)           | `typescript`                                                                             |
| `@arnaud-zg/configs/tsdown`                | `dist/base.js` (built from `tsdown/base.ts`) | `tsdown`, `typescript`                                                                   |
| `@arnaud-zg/configs/lefthook/lefthook.yml` | `lefthook/lefthook.yml`                      | `lefthook`, `prettier`, `@commitlint/cli`                                                |
| `@arnaud-zg/configs/remark`                | `remark/index.mjs`                           | `remark-cli`, `remark-preset-lint-recommended`                                           |
| `@arnaud-zg/configs/remark/docs`           | `remark/docs.mjs`                            | above, plus `remark-frontmatter`, `remark-gfm`                                           |
| `@arnaud-zg/configs/commitlint`            | `commitlint/index.mjs`                       | `@commitlint/cli`, `@commitlint/config-conventional`                                     |

## tsconfig variants

Every variant extends `base.json` (strict, `ES2022`, no emit), directly or through a chain.

| File                               | Extends             | Use case                 |
| ---------------------------------- | ------------------- | ------------------------ |
| `base.json`                        | none                | Foundation               |
| `node.json`                        | `base.json`         | Plain Node code          |
| `node-vitest.json`                 | `node.json`         | Node + Vitest            |
| `react.json`                       | `base.json`         | React web / DOM          |
| `react-vite.json`                  | `react.json`        | React + Vite             |
| `react-vite-storybook.json`        | `react.json`        | React + Vite + Storybook |
| `react-vitest.json`                | `react.json`        | React + Vitest           |
| `react-native.json`                | `base.json`         | React Native             |
| `react-native-vitest.json`         | `react-native.json` | React Native + Vitest    |
| `react-native-vite-storybook.json` | `react-native.json` | React Native + Storybook |
| `internal-package.json`            | `base.json`         | Library emitting `.d.ts` |

Always declare your own `include`/`exclude` in the extending project: several variants'
`${configDir}` paths don't expand when extended (see
[Explanation](./explanation.md#the-configdir-limitation)).

## Scripts (for contributors to this repo)

Not shipped to consumers: `devDependencies` never propagate.

| Script           | Runs                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| `pnpm lint`      | `eslint .`                                                                            |
| `pnpm lint:md`   | `remark . --frail --quiet`                                                            |
| `pnpm format`    | `prettier --write .`                                                                  |
| `pnpm typecheck` | `tsc --noEmit`, then again against every `*.test.ts` file                             |
| `pnpm test`      | `vitest run`                                                                          |
| `pnpm build`     | Builds `tsdown/base.ts` into `dist/` (this is what the `./tsdown` export resolves to) |
| `pnpm prepack`   | `pnpm build` (runs automatically before `pnpm pack` / `pnpm publish`)                 |
| `pnpm prepare`   | `lefthook install` (runs automatically after `pnpm install`)                          |

## Package layout

```
eslint/       base.mjs, react.mjs
prettier/     index.js
tsconfig/     base.json + 10 variants
tsdown/       base.ts (source; not what consumers import, see below)
lefthook/     lefthook.yml
remark/       index.mjs, docs.mjs
commitlint/   index.mjs
internal/     the peer-check engine (see Explanation), not a public export
dist/         base.js, base.d.ts (built from tsdown/base.ts at publish time, gitignored otherwise)
```

`package.json`'s `files` ships the eight public directories above plus `internal/` and `LICENSE`.
`dist/` doesn't exist in the repo itself; it's produced by the `prepack` script right before
packing/publishing (see [Explanation](./explanation.md#why-tsdown-is-the-one-export-thats-built)).
Tests live next to the file each one tests (`eslint/base.integration.test.ts`,
`internal/package-range.value-object.unit.test.ts`, and so on), not in a separate directory; see
[Test coverage](#test-coverage) below for the full layout and coverage map, and
[Explanation](./explanation.md#the-peer-check-engine) for how the peer-check engine itself is put
together.

## Test coverage

Every test file name ends with its layer, visible without opening the file: `.unit.test.ts`,
`.integration.test.ts`, or `.e2e.test.ts`.

|     | Layer       | Files                                                  | Touches                                       |
| --- | ----------- | ------------------------------------------------------ | --------------------------------------------- |
| ⚙️  | Static      | `pnpm typecheck` / `lint` / `lint:md` / `format:check` | nothing, static analysis only                 |
| 🧪  | Unit        | 8                                                      | nothing: pure logic, no filesystem or process |
| 🔗  | Integration | 13                                                     | a real tool, file, or process                 |
| 🚀  | E2E         | 1                                                      | a real published, installed package           |

Integration is deliberately the biggest layer, not unit: most of what this package does only means
something once a real tool (ESLint, Prettier, tsc, tsdown, remark, lefthook, commitlint) actually
runs against it. Each layer tests what the layer below it can't, and nothing is re-proven across
layers, with one deliberate exception: `devdependencies-satisfy-peers.integration.test.ts` reproves
something the individual `eslint/`, `prettier/`, `remark/`, `commitlint/`, and `tsdown/` integration
tests already exercise as a side effect of importing those files. Those tests exist to check tool
_behavior_, not to guard the peer contract, so nothing would fail if a future refactor swapped one
of those imports for a fixture; this file's only job is to make that guarantee explicit and named,
not incidental.

| Layer          | File                                                     | Proves                                                                          |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| ⚙️ Static      | `pnpm typecheck`                                         | Every file type-checks                                                          |
| ⚙️ Static      | `pnpm lint`                                              | Every file is lint-clean                                                        |
| ⚙️ Static      | `pnpm lint:md`                                           | Every Markdown file is lint-clean                                               |
| ⚙️ Static      | `pnpm format:check`                                      | Every file is Prettier-formatted                                                |
| 🧪 Unit        | `internal/package-range.value-object.unit.test.ts`       | `PackageRange` wraps a range and compares it, nothing else                      |
| 🧪 Unit        | `internal/installed-package.value-object.unit.test.ts`   | `InstalledPackage` represents present/absent correctly                          |
| 🧪 Unit        | `internal/peer-requirement.value-object.unit.test.ts`    | `PeerRequirement` checks a given fact, without resolving one itself             |
| 🧪 Unit        | `internal/caret-range.unit.test.ts`                      | The hand-written caret-range comparator, including the 0.x edge cases           |
| 🧪 Unit        | `internal/missing-peer-dependencies-error.unit.test.ts`  | The thrown error's message and structured fields                                |
| 🧪 Unit        | `internal/peer-check-toggle.unit.test.ts`                | The escape-hatch env var, read in isolation                                     |
| 🧪 Unit        | `internal/subpath-peer-registry.unit.test.ts`            | The subpath-to-peers table and its lookups                                      |
| 🧪 Unit        | `package.unit.test.ts`                                   | `package.json`'s exports and peerDependencies are declared correctly            |
| 🔗 Integration | `internal/resolve-installed-package.integration.test.ts` | The one real filesystem lookup, including the remark-cli `exports: []` fallback |
| 🔗 Integration | `internal/peer-requirement-list.integration.test.ts`     | Real resolution plus aggregation, satisfied and unsatisfied                     |
| 🔗 Integration | `eslint/base.integration.test.ts`                        | A real ESLint instance lints real code against the base config                  |
| 🔗 Integration | `eslint/react.integration.test.ts`                       | A real ESLint + real tsc catch real JSX issues                                  |
| 🔗 Integration | `prettier/index.integration.test.ts`                     | Real `prettier.format()` calls produce the expected output                      |
| 🔗 Integration | `remark/index.integration.test.ts`                       | The real `remark` CLI lints real Markdown against the base config               |
| 🔗 Integration | `remark/docs.integration.test.ts`                        | The real `remark` CLI against the docs config (frontmatter, GFM)                |
| 🔗 Integration | `tsconfig/tsconfig.integration.test.ts`                  | Real `tsc` compiles fixtures against each tsconfig variant                      |
| 🔗 Integration | `tsdown/base.integration.test.ts`                        | Real `tsdown` builds a fixture, and this repo's own `dist/`                     |
| 🔗 Integration | `lefthook.integration.test.ts`                           | The real `lefthook` binary resolves this repo's hook chain                      |
| 🔗 Integration | `commitlint.config.integration.test.ts`                  | The real `commitlint` binary accepts/rejects real commit messages               |
| 🔗 Integration | `peer-check-consumer.integration.test.ts`                | A real import of a copied `prettier/index.js` enforces the peer check           |
| 🔗 Integration | `devdependencies-satisfy-peers.integration.test.ts`      | This repo's own devDependencies satisfy every declared peer, explicitly         |
| 🚀 E2E         | `tsdown-consumer.e2e.test.ts`                            | A real `pnpm pack` + `pnpm install` + build against the published tarball       |
