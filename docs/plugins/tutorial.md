# Tutorial — your first plugin, end to end

Goal: go from an empty catalogue to a plugin you installed on your own machine from this
marketplace. Roughly ten minutes. Nothing here is published or pushed until the last step, and that
step is optional.

You need the `claude` CLI and a clone of this repository.

## 1. Copy the template

```sh
cd configs
cp -R templates/plugin-template plugins/hello-tools
```

## 2. Name the plugin

Edit `plugins/hello-tools/.claude-plugin/plugin.json`. At minimum, `name` must match the directory
name:

```jsonc
{
  "$schema": "https://anthropic.com/claude-code/plugin.schema.json",
  "name": "hello-tools",
  "displayName": "Hello Tools",
  "version": "0.1.0",
  "description": "Scratch plugin used to learn the workflow.",
  "author": { "name": "Arnaud Zheng", "url": "https://github.com/arnaud-zg" },
  "license": "MIT",
}
```

Delete `dependencies` and `keywords` for now; both are optional.

Then set the matching name in `plugins/hello-tools/package.json`:

```jsonc
{ "name": "@arnaud-zg/plugin-hello-tools", "version": "0.1.0", "private": true }
```

That file is private and never published. It exists so changesets can version the plugin alongside
the npm package — see [why](../how-to.md#why-plugins-carry-a-packagejson).

## 3. Write one skill

Rename the example and give it a real trigger:

```sh
mv plugins/hello-tools/skills/example-skill plugins/hello-tools/skills/repo-tour
```

`plugins/hello-tools/skills/repo-tour/SKILL.md`:

```markdown
---
name: repo-tour
description:
  Use when the user asks for a tour, overview or orientation of an unfamiliar repository — "what is
  this repo", "give me a tour", "where do I start". Produces a short map of entry points, not a file
  listing.
---

# Repo tour

1. Read the README and any `docs/` index, if present.
2. Identify the entry points: `main`, `index`, `cmd/`, `src/app`, or the `bin`/`scripts` fields of
   the package manifest.
3. Report at most seven places that matter, each with one line on why it matters.
4. Do not list every file. If the repository is large, say what you skipped.
```

The `description` is the part that decides whether this ever runs. Write it as trigger conditions,
including phrases a user would really type.

Delete the parts of the template you are not using:

```sh
rm -rf plugins/hello-tools/agents plugins/hello-tools/hooks plugins/hello-tools/hooks-handlers
rm -f plugins/hello-tools/.mcp.json plugins/hello-tools/README.md
```

## 4. Validate before listing it

```sh
claude plugin validate plugins/hello-tools --strict
```

`--strict` also fails on things the runtime would tolerate — unrecognised fields, missing metadata.
Fix anything it reports before continuing.

## 5. List it in the marketplace

Add an entry to `.claude-plugin/marketplace.json`. Because `metadata.pluginRoot` is `./plugins`, the
`source` can be the bare directory name:

```jsonc
{
  "plugins": [
    {
      "name": "hello-tools",
      "source": "hello-tools",
      "description": "Scratch plugin used to learn the workflow.",
      "category": "development",
    },
  ],
}
```

Validate the marketplace too:

```sh
claude plugin validate . --strict
```

## 6. Install it from your working copy

A marketplace source can be a local path, so you can test the real install path without pushing:

```sh
claude plugin marketplace add ./          # run from the repo root
claude plugin install hello-tools@arnaud-zg
```

`arnaud-zg` is the `name` field in `marketplace.json`, not the repository name.

## 7. Check what you got

```sh
claude plugin list
claude plugin details hello-tools
```

`details` shows the component inventory and the projected token cost — how much context this plugin
occupies in every conversation. Watch that number; it is the running cost of the skill descriptions.

Start a new session and ask for a repo tour. The skill should fire on its own. If it does not, the
`description` is the thing to fix.

## 8. Clean up, or publish

To undo everything:

```sh
claude plugin uninstall hello-tools
claude plugin marketplace remove arnaud-zg
```

To publish instead, record a changeset, commit the plugin, and open a pull request:

```sh
pnpm changeset       # pick @arnaud-zg/plugin-hello-tools
```

After it merges, the release flow versions and tags it along with everything else — see
[the release how-to](../how-to.md#release-a-new-version).

Anyone can then run:

```sh
/plugin marketplace add arnaud-zg/configs
/plugin install hello-tools@arnaud-zg
```

## Where to go next

- [how-to.md](./how-to.md) — adding agents, hooks, MCP servers, dependencies and versions
- [explanation.md](./explanation.md) — why the layers are shaped this way
- [reference.md](./reference.md) — every manifest field and CLI command
