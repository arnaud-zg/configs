# How-to

Task-oriented recipes. For the guided first run, use [tutorial.md](./tutorial.md).

## Add a plugin

```sh
cp -R templates/plugin-template plugins/<name>
```

1. Set `name` in `plugins/<name>/.claude-plugin/plugin.json` to match the directory.
2. Delete the component directories the plugin does not use.
3. Add an entry to `.claude-plugin/marketplace.json` with `"source": "<name>"`.
4. `claude plugin validate . --strict`

## Add a skill to an existing plugin

```sh
mkdir -p plugins/<plugin>/skills/<skill>
```

Write `SKILL.md` with `name` and `description` frontmatter. Nothing to register — `skills/` is
scanned by name.

Make it a slash command instead of a model-invoked skill by adding `argument-hint` and
`allowed-tools`:

```markdown
---
name: audit-deps
description: Audit dependencies for known advisories and unpinned ranges.
argument-hint: "[package-name]"
allowed-tools: [Read, Glob, Grep, Bash]
---
```

It becomes `/<plugin>:audit-deps`.

Keep `SKILL.md` short. Put long material in sibling files and reference them from the body:

```
skills/audit-deps/
├── SKILL.md              # loaded whenever the skill fires
├── advisory-format.md    # loaded only if SKILL.md tells Claude to read it
└── scripts/scan.sh
```

## Add a subagent

`plugins/<plugin>/agents/<name>.md`, frontmatter `name`, `description`, `tools`. The `description`
tells Claude when to delegate. Auto-discovered.

## Add hooks

`plugins/<plugin>/hooks/hooks.json`, same shape as the `hooks` block in `settings.json`. Reference
handler scripts through `${CLAUDE_PLUGIN_ROOT}`, which expands to the installed plugin directory:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks-handlers/guard.sh" }]
      }
    ]
  }
}
```

Hooks run on the installing machine, on every matching tool call. Keep them fast and make them exit
non-zero only when you genuinely want to block.

## Add an MCP server

`plugins/<plugin>/.mcp.json`, keyed under `mcpServers`. Auto-discovered.

```json
{
  "mcpServers": {
    "my-api": { "type": "http", "url": "https://api.example.com/mcp" }
  }
}
```

## Make a plugin depend on a base

In the dependent plugin's `plugin.json`:

```jsonc
{
  "name": "react-tools",
  "dependencies": ["ts-base"],
}
```

A bare name resolves inside this marketplace. Installing `react-tools` auto-installs `ts-base` and
enables it. To depend on a plugin from another marketplace, use `name@marketplace` **and** allow
that marketplace at the root:

```jsonc
// .claude-plugin/marketplace.json
{
  "allowCrossMarketplaceDependenciesOn": ["claude-plugins-official"],
}
```

To constrain the version, append a range: `"ts-base@^1.2.0"`. It resolves against the dependency's
git tags, so the dependency must be tagged (see below).

## Test locally before pushing

```sh
claude plugin validate . --strict            # marketplace + every listed plugin
claude plugin marketplace add ./             # from the repo root
claude plugin install <plugin>@arnaud-zg
claude plugin details <plugin>               # inventory + projected token cost
```

Iterating on an installed plugin: `/reload-plugins` picks up changes without restarting the session.

Undo:

```sh
claude plugin uninstall <plugin>
claude plugin marketplace remove arnaud-zg
```

## Draft a skill without packaging it

```sh
claude plugin init <name> --with skills agents hooks mcp
```

This scaffolds `~/.claude/skills/<name>/`, which auto-loads next session as `<name>@skills-dir` — no
marketplace, no install, no version. Iterate there, then move the directory into `plugins/` when it
is worth publishing.

## Release a version

1. Bump `version` in the plugin's `plugin.json`.
2. Merge to `main`.
3. Tag:

```sh
claude plugin tag plugins/<name>     # creates <name>--v<version>
git push --tags
```

`claude plugin tag` refuses to tag if `plugin.json` and the marketplace entry disagree, which is the
check you want before a version becomes resolvable by a dependency range.

Consumers pick it up with `claude plugin update <name>`, or automatically if their marketplace is
set to auto-update. Updates apply on restart.

## Rename a plugin

Renaming breaks every existing install, so record it in the marketplace's append-only `renames` map:

```jsonc
{
  "renames": { "old-name": "new-name" },
}
```

The loader follows this when a plugin is not found and migrates user settings to the new name. Map
to `null` instead of a name when a plugin is removed for good.

## Remove a plugin

Delete the directory and its marketplace entry, and add `"<name>": null` to `renames`. If you want
existing installs cleaned up rather than left orphaned, set `forceRemoveDeletedPlugins: true` at the
marketplace root — removed plugins are then uninstalled automatically and flagged for users.

## Review a plugin before installing one you did not write

Plugins execute code on your machine through hooks and MCP servers, and there is no sandbox. Before
installing:

- Read `hooks/hooks.json` and every script it points at.
- Read `.mcp.json` — check where a remote server sends data, and what a local one runs.
- Check `dependencies` for plugins from marketplaces you have not vetted.
- Pin: install from a tag, and read the diff before `claude plugin update`.
