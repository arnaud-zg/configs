# @arnaud-zg/configs

Shareable dev-tooling configs (ESLint, Prettier, tsconfig, tsdown, Lefthook, remark, and commitlint)
bundled as a single package with subpath exports. Install what you need; every peer dependency is
optional.

I built this to stop copy-pasting the same ESLint/Prettier/tsconfig/Lefthook setup into every one of
my projects.

```sh
pnpm add -D @arnaud-zg/configs@0.3.0
```

Always pin the exact version above (not a range like `^x.y.z`, and not `latest`), so an update to
this package only reaches your project when you deliberately bump it. This repo follows semver, but
that's a promise about intent, not a guarantee: you can't know what a future version will contain
until you've read it. Never trust a dependency by default, including this one. Pin the exact version
you've actually reviewed, and only move to a newer one after reviewing that too.

## 🔒 Security: know what you're installing

This section is prevention, not paranoia about this package specifically: it's the same due
diligence you should apply to any dependency, and it applies most here because
`@arnaud-zg/configs/lefthook/*` runs shell commands on your machine on every commit/push. I have no
intention of shipping anything malicious, but intent isn't a security control, verification is.
Don't install anything, from me or anyone else, that you haven't verified yourself.

- **Read every file for the subpath you install before you install it**, especially
  [`lefthook/lefthook.yml`](./lefthook/lefthook.yml). Don't take this README's word for what a
  config does, or anyone else's.
- **Understand each line**, not just skim it. If something isn't clear, that's a stop sign, not a
  detail to gloss over: [open an issue](https://github.com/arnaud-zg/configs/issues) and ask, I'm
  happy to explain or fix it.
- **Ask an AI assistant to review the files for security risk** before installing, a second, fast
  pass on top of your own read.
- **Pin the exact version you reviewed** (see above), and repeat this review before ever bumping it.
  A version you haven't read is not a version you've verified, no matter who published it.

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

## 🤖 Claude Code plugins

This repository is also a [Claude Code](https://claude.com/claude-code) plugin marketplace: a
catalogue of skills, subagents, hooks and MCP servers that install with a version and uninstall
cleanly, instead of being copy-pasted into `~/.claude/`.

```sh
/plugin marketplace add arnaud-zg/configs
/plugin install <plugin>@arnaud-zg
```

The catalogue is **empty for now** — `.claude-plugin/marketplace.json` lists no plugins, and
`templates/plugin-template/` is the starting point to add one. None of this ships in the npm
package: the marketplace is consumed with `git clone`, the configs with `pnpm add`.

The same warning as above applies, more sharply: a plugin's hooks run shell commands on your machine
and its MCP servers talk to remote endpoints, with no sandbox. Read `hooks/`, `.mcp.json` and
`dependencies` before installing anything, here or anywhere else.

- 🚀 **[Tutorial](./docs/plugins/tutorial.md)**: build and install your first plugin, end to end.
- 🛠️ **[How-to guides](./docs/plugins/how-to.md)**: add a skill, agent, hook, MCP server or
  dependency; test locally; release; rename.
- 📖 **[Reference](./docs/plugins/reference.md)**: every manifest field, component discovery rule,
  and CLI command.
- 💡 **[Explanation](./docs/plugins/explanation.md)**: what skills, plugins and marketplaces are,
  and why the layers are split that way.

## License

MIT
