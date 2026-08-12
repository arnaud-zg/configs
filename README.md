# @arnaud-zg/configs

Shareable dev-tooling configs (ESLint, Prettier, tsconfig, tsdown, Lefthook, remark, and commitlint)
bundled as a single package with subpath exports. Install what you need; every peer dependency is
optional.

```sh
pnpm add -D @arnaud-zg/configs
```

## 📚 Documentation

- 🚀 **[Tutorial](./docs/tutorial.md)**: new here? A hands-on walkthrough that wires up ESLint,
  Prettier, and a tsconfig from scratch.
- 🛠️ **[How-to guides](./docs/how-to.md)**: task-based recipes for linting React code, picking a
  tsconfig variant, configuring a tsdown build, adding Git hooks, linting Markdown, running the test
  suite, and releasing a new version.
- 📖 **[Reference](./docs/reference.md)**: the exports map, peer dependencies, tsconfig variants,
  and package layout.
- 💡 **[Explanation](./docs/explanation.md)**: why the package is structured this way, one package
  versus five, optional peers, no build step, the `${configDir}` limitation, and more.

## 🧰 What's inside

| Subpath                              | What it is                                       |
| ------------------------------------ | ------------------------------------------------ |
| `@arnaud-zg/configs/eslint`          | ESLint 9 flat config (+ `/react` variant)        |
| `@arnaud-zg/configs/prettier`        | Prettier config with import sorting              |
| `@arnaud-zg/configs/tsconfig/*.json` | 11 tsconfig variants to extend                   |
| `@arnaud-zg/configs/tsdown`          | Shared tsdown build defaults                     |
| `@arnaud-zg/configs/lefthook/*`      | Shared Lefthook base (commit-msg via commitlint) |
| `@arnaud-zg/configs/remark`          | remark-lint recommended preset                   |
| `@arnaud-zg/configs/commitlint`      | Conventional Commits, mandatory scope            |

## License

MIT
