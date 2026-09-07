# Reference

Field-by-field. Verified against Claude Code `2.1.263` manifest schemas and `claude plugin --help`;
re-check after a major CLI upgrade.

## Repository layout

```
configs/
├── .claude-plugin/
│   └── marketplace.json          # the catalogue — this file makes the repo a marketplace
├── plugins/                      # plugins hosted here (metadata.pluginRoot)
│   └── <plugin>/
│       ├── .claude-plugin/
│       │   └── plugin.json       # the manifest — this file makes the directory a plugin
│       ├── skills/<skill>/SKILL.md
│       ├── agents/<agent>.md
│       ├── commands/<command>.md
│       ├── hooks/hooks.json
│       └── .mcp.json
├── templates/plugin-template/    # not listed in the catalogue; copy to start
├── docs/plugins/                 # this documentation
└── …                             # the @arnaud-zg/configs package itself
```

The marketplace shares this repository with the `@arnaud-zg/configs` npm package. The two do not
overlap: `.claude-plugin/`, `plugins/` and `templates/` are absent from the package's `files` list,
and `docs/plugins/` is excluded from it, so none of this ships in the npm tarball. The package is
consumed with `pnpm add`, the marketplace with `git clone` — same repository, different door.

## `marketplace.json`

At the repository root, in `.claude-plugin/`.

| Field                                 | Type             | Notes                                                                                                                                                                                                     |
| ------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                                | string, required | Marketplace id used in `plugin@marketplace`. Kebab-case; no spaces, path separators or `..`. Cannot impersonate an official Anthropic marketplace. Reserved: `inline`, `builtin`, `skills-dir`, `synced`. |
| `owner`                               | object, required | `{ name, email?, url? }`                                                                                                                                                                                  |
| `plugins`                             | array, required  | Catalogue entries; may be empty                                                                                                                                                                           |
| `description`                         | string           | Shown when browsing marketplaces                                                                                                                                                                          |
| `metadata.pluginRoot`                 | string           | Base directory for bare `source` names, e.g. `"./plugins"` makes `"source": "formatter"` resolve to `./plugins/formatter`. Sources already starting with `./` are unaffected.                             |
| `metadata.version`                    | string           | Marketplace version                                                                                                                                                                                       |
| `metadata.description`                | string           | Alternate description slot                                                                                                                                                                                |
| `allowCrossMarketplaceDependenciesOn` | string[]         | Marketplace names whose plugins may be auto-installed as dependencies. Only the root marketplace's allowlist applies — no transitive trust.                                                               |
| `forceRemoveDeletedPlugins`           | boolean          | When true, plugins removed from the catalogue are uninstalled from users and flagged                                                                                                                      |
| `renames`                             | map              | Append-only `old name → current name`, or `null` when removed. Followed on plugin-not-found; migrates user settings.                                                                                      |

### Catalogue entry

| Field         | Notes                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `name`        | Required. Must match the plugin's own `name`.                                                                        |
| `source`      | Required. See below.                                                                                                 |
| `description` | Shown in `/plugin` browse and search. This is the discovery text — write it for a human deciding whether to install. |
| `author`      | `{ name, email?, url? }`                                                                                             |
| `category`    | e.g. `development`, `security`, `productivity`                                                                       |
| `homepage`    | Documentation URL                                                                                                    |
| `tags`        | string[]                                                                                                             |
| `version`     | Optional; must agree with `plugin.json` (`claude plugin tag` enforces this)                                          |
| `strict`      | Stricter manifest validation for this entry                                                                          |

### `source` forms

```jsonc
"source": "hello-tools"                    // bare name, resolved under metadata.pluginRoot
"source": "./plugins/hello-tools"          // path relative to the marketplace root
"source": { "source": "github", "repo": "owner/repo" }
"source": {                                 // a subdirectory of another repository, pinned
  "source": "git-subdir",
  "url": "https://github.com/owner/repo.git",
  "path": "plugins/thing",
  "ref": "v1.5.5",
  "sha": "30287f5e3f122a646d1ac5ca3ab96e130c52a3ad"
}
```

Pin third-party entries with both `ref` and `sha`. A tag can be moved; a SHA cannot.

## `plugin.json`

In the plugin's `.claude-plugin/` directory.

| Field            | Type             | Notes                                                                                                                                                                                       |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`           | string, required | Unique id, used for namespacing. Kebab-case, no spaces.                                                                                                                                     |
| `displayName`    | string           | Human-readable name shown in the UI; may contain spaces and casing. Not used for lookup.                                                                                                    |
| `version`        | string           | Semver. Required in practice if anything depends on you.                                                                                                                                    |
| `description`    | string           | User-facing explanation of what the plugin provides                                                                                                                                         |
| `author`         | object           | `{ name, email?, url? }`                                                                                                                                                                    |
| `homepage`       | string (URL)     |                                                                                                                                                                                             |
| `repository`     | string           | Source repository URL                                                                                                                                                                       |
| `license`        | string           | SPDX identifier, e.g. `MIT`                                                                                                                                                                 |
| `keywords`       | string[]         | Discovery tags                                                                                                                                                                              |
| `defaultEnabled` | boolean          | Whether the plugin starts enabled absent an explicit user setting (default `true`). Explicit user settings always win, and a plugin required by an enabled dependent is enabled regardless. |
| `dependencies`   | string[]         | See below                                                                                                                                                                                   |
| `metadata`       | object           | Free-form, for the author's own use. Preserved but not read by Claude Code.                                                                                                                 |

### `dependencies`

Plugins that must be enabled for this plugin to function.

| Form               | Meaning                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `"ts-base"`        | Resolved against the declaring plugin's own marketplace                  |
| `"ts-base@other"`  | From marketplace `other`; requires `allowCrossMarketplaceDependenciesOn` |
| `"ts-base@^1.2.0"` | Version constraint, resolved against the dependency's git tags           |

Dependencies are auto-installed and flagged as such; `claude plugin prune` removes auto-installed
plugins that nothing depends on any more.

## Component discovery

You normally write none of these keys — the directories are found by name. The manifest keys exist
only to point somewhere non-standard, and **their override semantics differ**:

| Component     | Found automatically at   | Manifest key   | When the key is set                           |
| ------------- | ------------------------ | -------------- | --------------------------------------------- |
| Skills        | `skills/<name>/SKILL.md` | `skills`       | loaded **in addition** to `skills/`           |
| Subagents     | `agents/*.md`            | `agents`       | `agents/` is **no longer** auto-loaded        |
| Commands      | `commands/*.md` (legacy) | `commands`     | `commands/` is **no longer** auto-loaded      |
| Hooks         | `hooks/hooks.json`       | `hooks`        | loaded **in addition** to `hooks/hooks.json`  |
| MCP servers   | `.mcp.json`              | `mcpServers`   | loaded **in addition** to `.mcp.json`         |
| Output styles | `output-styles/`         | `outputStyles` | `output-styles/` is **no longer** auto-loaded |
| LSP servers   | —                        | `lspServers`   | declaration only                              |

`skills` accepts `"."` or `"./"` to mean the plugin root itself, which is how a plugin can be a
single skill with `SKILL.md` at its top level.

`${CLAUDE_PLUGIN_ROOT}` expands to the installed plugin directory. Use it in every hook command and
script path — never a relative or hard-coded path.

## `SKILL.md` frontmatter

```markdown
---
name: skill-name
description: When Claude should use this, in the words a user would type.
---
```

| Field           | Notes                                                               |
| --------------- | ------------------------------------------------------------------- |
| `name`          | Required. Becomes `/<plugin>:<name>` for user-invoked skills.       |
| `description`   | Required. The trigger. Always resident in context; the body is not. |
| `argument-hint` | Makes it a slash command; shown in `/help`, e.g. `<file> [--fix]`   |
| `allowed-tools` | Restricts tools while the skill runs, e.g. `[Read, Glob, Grep]`     |
| `version`       | Optional                                                            |

Model-invoked and user-invoked are the same file format. Adding `argument-hint` / `allowed-tools` is
what surfaces it as a slash command.

## CLI

| Command                                    | Purpose                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `claude plugin marketplace add <source>`   | Add a marketplace: `owner/repo`, a URL, or a local path                                                  |
| `claude plugin marketplace list`           | List configured marketplaces                                                                             |
| `claude plugin marketplace update [name]`  | Pull latest; all marketplaces if no name                                                                 |
| `claude plugin marketplace remove <name>`  | Remove a marketplace                                                                                     |
| `claude plugin install <plugin>[@market]`  | Install                                                                                                  |
| `claude plugin list`                       | List installed plugins                                                                                   |
| `claude plugin details <name>`             | Component inventory and projected token cost                                                             |
| `claude plugin enable` / `disable`         | Toggle without uninstalling                                                                              |
| `claude plugin update <name>`              | Update (applies on restart)                                                                              |
| `claude plugin uninstall <name>`           | Remove                                                                                                   |
| `claude plugin prune`                      | Remove auto-installed dependencies nothing needs                                                         |
| `claude plugin validate <path> [--strict]` | Validate a plugin or marketplace; `--strict` fails on warnings — use in CI                               |
| `claude plugin init <name> [--with …]`     | Scaffold into `~/.claude/skills/<name>/`; components: `skills agents hooks mcp lsp output-style channel` |
| `claude plugin tag [path]`                 | Create `<name>--v<version>` git tag, checking manifests agree                                            |
| `claude plugin eval [target]`              | Run eval cases against a plugin                                                                          |

In-session equivalents: `/plugin` for the browser, `/reload-plugins` to pick up local edits without
restarting.

## On disk

| Path                                        | Contents                                                |
| ------------------------------------------- | ------------------------------------------------------- |
| `~/.claude/plugins/known_marketplaces.json` | Registered marketplaces and their cache paths           |
| `~/.claude/plugins/marketplaces/<name>/`    | Cloned marketplace repository                           |
| `~/.claude/skills/<name>/`                  | Unpackaged local plugins, loaded as `<name>@skills-dir` |

Installed plugin directories are recorded per-install; `claude plugin list` and
`claude plugin details <name>` report the resolved paths.
