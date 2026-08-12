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
| `pnpm typecheck` | `tsc --noEmit`, then again against `__tests__/`                                       |
| `pnpm test`      | `vitest run`                                                                          |
| `pnpm build`     | Builds `tsdown/base.ts` into `dist/` — this is what the `./tsdown` export resolves to |
| `pnpm prepack`   | `pnpm build` (runs automatically before `pnpm pack` / `pnpm publish`)                 |
| `pnpm prepare`   | `lefthook install` (runs automatically after `pnpm install`)                          |

## Package layout

```
eslint/       base.mjs, react.mjs
prettier/     index.js
tsconfig/     base.json + 10 variants
tsdown/       base.ts (source; not what consumers import, see below)
lefthook/     lefthook.yml
remark/       index.mjs
commitlint/   index.mjs
dist/         base.js, base.d.ts — built from tsdown/base.ts at publish time, gitignored otherwise
__tests__/    this repo's own tests (not published)
```

`package.json`'s `files` ships the eight directories above plus `LICENSE`. `dist/` doesn't exist in
the repo itself — it's produced by the `prepack` script right before packing/publishing (see
[Explanation](./explanation.md#why-tsdown-is-the-one-export-thats-built)).
