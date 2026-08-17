# @arnaud-zg/configs

Shareable dev-tooling configs (ESLint, Prettier, tsconfig, tsdown, Lefthook, remark, and commitlint)
bundled as a single package with subpath exports. Install what you need; every peer dependency is
optional.

I built this to stop copy-pasting the same ESLint/Prettier/tsconfig/Lefthook setup into every one of
my projects.

```sh
pnpm add -D @arnaud-zg/configs@0.3.0
```

Always pin the exact version above (not `^0.3.0` or `latest`) rather than a range, so an update to
this package only reaches your project when you deliberately bump it. This repo follows semver, so
patch/minor bumps should be safe, but pinning is still the right default for anything you depend on.

## ⚠️ Before you install

Please read this before adding `@arnaud-zg/configs` as a dependency, especially
`@arnaud-zg/configs/lefthook/*`: Lefthook runs shell commands on your machine on every commit/push,
so anything under `lefthook/` is worth reading in full before you wire it in. I have no intention of
shipping anything malicious, but "trust me" isn't good security practice, for this package or any
other dependency you add.

- Read the files for whatever subpath you install. Don't take this README's word for what a config
  does.
- Take the time to understand each line, not just skim it. If something isn't clear, please
  [open an issue](https://github.com/arnaud-zg/configs/issues), I'm happy to explain or fix it.
- Feel free to ask an AI assistant to review the files for security concerns before installing.
- Always pin the exact version you install (see above).

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
