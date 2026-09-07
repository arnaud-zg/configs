# plugin-template

Starting point for a new plugin in this marketplace. It is **not** listed in
`.claude-plugin/marketplace.json`, so nothing here is installable until you copy it.

```sh
cp -R templates/plugin-template plugins/my-plugin
```

Then work through [docs/plugins/tutorial.md](../../docs/plugins/tutorial.md).

## What is here

| Path                         | Layer  | Delete it if…                        |
| ---------------------------- | ------ | ------------------------------------ |
| `.claude-plugin/plugin.json` | plugin | never — this file defines the plugin |
| `skills/example-skill/`      | skill  | the plugin ships no skills           |
| `agents/example-agent.md`    | agent  | the plugin ships no subagents        |
| `hooks/hooks.json`           | hook   | the plugin ships no hooks            |
| `hooks-handlers/`            | hook   | you deleted `hooks/hooks.json`       |
| `.mcp.json`                  | MCP    | the plugin ships no MCP servers      |

Every one of these directories is discovered by name. You do not list them in `plugin.json` — see
[docs/plugins/reference.md](../../docs/plugins/reference.md#component-discovery).
