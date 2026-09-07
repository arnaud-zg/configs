# Explanation — what skills, plugins and marketplaces actually are

This page is about the model. If you want commands, read [how-to.md](./how-to.md).

## The problem this solves

Claude Code can be extended with prompts (skills), subagents, slash commands, lifecycle hooks and
MCP servers. Historically each tool shipped its own installer script that copied files into
`~/.claude/` — into `~/.claude/skills/`, `~/.claude/commands/`, `~/.claude/hooks/`, plus edits to
`~/.claude/settings.json`. That works exactly once. It gives you no version, no uninstall, no way to
see what you have, and no way to know which file came from which tool.

The plugin system replaces that with three nested units. Each one exists to answer a different
question.

## The three layers

```
marketplace          "where do I get things, and do I trust the source?"
└── plugin           "what do I install, enable, version and uninstall?"
    └── skill        "what does Claude actually do differently?"
        agent
        command
        hook
        MCP server
```

### Skill — the unit of behaviour

A skill is a Markdown file, `SKILL.md`, with YAML frontmatter:

```markdown
---
name: review-migrations
description: Use when the user asks to review, check or sanity-check a database migration…
---

# Review migrations

1. Find the migration files changed on this branch.
2. …
```

The body is a prompt addressed to Claude. The `description` is the trigger: Claude reads every
installed skill's `name` and `description` at all times, and loads the body only when a request
matches. That asymmetry is the whole design — descriptions are cheap and always resident, bodies are
expensive and loaded on demand. A vague description means the skill never fires; a body stuffed with
reference material means every firing costs you context.

Two flavours, distinguished only by frontmatter:

- **Model-invoked** — `name` + `description`. Claude decides when to use it.
- **User-invoked** — add `argument-hint` and/or `allowed-tools`, and it also becomes the slash
  command `/name`. The user decides when to use it.

A skill directory can hold more than `SKILL.md`: reference documents, scripts, templates. Claude
reads those only if the skill body tells it to, which is how you ship a large capability without
paying for it in every conversation.

### Plugin — the unit of distribution

A plugin is a directory with `.claude-plugin/plugin.json` and, next to it, whichever component
directories it needs:

```
my-plugin/
├── .claude-plugin/plugin.json
├── skills/<name>/SKILL.md
├── agents/<name>.md
├── commands/<name>.md          # legacy layout; prefer skills/
├── hooks/hooks.json
└── .mcp.json
```

The plugin is what a user installs, enables, disables, versions and uninstalls. It is also the
namespace: a skill named `review` inside plugin `db-tools` is `/db-tools:review`, so two plugins can
both ship a `review` without colliding.

The directories above are discovered **by name**. You do not list them in `plugin.json`. The
manifest is metadata — identity, version, author, dependencies — not a file index.

### Marketplace — the unit of discovery and trust

A marketplace is a git repository with `.claude-plugin/marketplace.json` at its root, listing
plugins. It is the thing a user adds once:

```sh
/plugin marketplace add arnaud-zg/configs
```

From then on they can install any plugin it lists, and `claude plugin marketplace update` pulls new
versions. Trust is granted at this level, not per plugin — adding a marketplace means accepting
whatever its maintainer lists, now and later. That is why cross-marketplace dependencies require an
explicit allowlist (see below): adding one marketplace must not silently pull code from another.

A marketplace does not have to host the plugins it lists. Entries can point at subdirectories of
other repositories, pinned to a tag and a commit SHA, which is how the official catalogue lists
third-party plugins it does not own.

## Composition: base plugins and dependencies

`plugin.json` has a `dependencies` array — _"plugins that must be enabled for this plugin to
function"_. This is the mechanism for a shared base:

```jsonc
// plugins/react/.claude-plugin/plugin.json
{
  "name": "react",
  "dependencies": ["ts-base", "lint-base@^1.2.0"],
}
```

- A bare name (`ts-base`) resolves inside the declaring plugin's own marketplace.
- `name@marketplace` crosses marketplaces, and only works if the root marketplace lists that
  marketplace in `allowCrossMarketplaceDependenciesOn`. There is no transitive trust.
- `name@^1.2.0` constrains the version, resolved against the dependency's git tags.

Installing `react` pulls `ts-base` in automatically and marks it auto-installed. Uninstalling
`react` leaves it behind until `claude plugin prune` sweeps dependencies nothing depends on any
more. A plugin required by an enabled dependent is enabled regardless of its own `defaultEnabled`.

So composition happens twice, and it is worth being deliberate about which one you are using:

- **The user composes** by installing several small plugins. Best when the pieces are genuinely
  independent and someone might want one without the others.
- **You compose** by declaring `dependencies` on a base. Best when a plugin is meaningless without
  the base — shared conventions, a shared reference document, a shared hook.

Prefer the first. A dependency is a constraint you impose on every consumer; splitting into
independent plugins leaves the choice with them.

## What this is not

- **Not a package manager for code.** Plugins are prompts and configuration. There is no build step,
  no `node_modules`, no npm publish. Distribution is `git clone`.
- **Not per-project by default.** Installing a plugin affects your Claude Code, not your repository.
  A project can pin plugins in its own settings, but the marketplace itself is user-level.
- **Not sandboxed.** Hooks and MCP servers in a plugin execute on the installing machine. That is
  the reason trust sits at the marketplace layer, and the reason to read a plugin before installing
  it.

## Where the alternatives still make sense

| Approach                   | Versioned | Shareable | Good for                        |
| -------------------------- | --------- | --------- | ------------------------------- |
| `~/.claude/skills/<name>/` | no        | no        | drafting; personal one-offs     |
| Project `.claude/skills/`  | via git   | via repo  | conventions for one codebase    |
| Plugin in a marketplace    | yes       | yes       | anything you want others to use |

The first is not a lesser version of the third — it is where you draft. A directory under
`~/.claude/skills/` auto-loads as its own plugin (`<name>@skills-dir`) with no manifest and no
install step, so you can iterate on a skill in a live session and only package it once it earns it.
