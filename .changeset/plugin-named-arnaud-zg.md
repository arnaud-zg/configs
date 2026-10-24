---
"@arnaud-zg/plugin-arnaud-zg": minor
---

The plugin is now `arnaud-zg`, so its skill reads `/arnaud-zg:hexagonal-skill-builder` instead of
`/hexagonal-skill-builder:hexagonal-skill-builder`, and later skills from this marketplace join it
under the same name. The skill itself is unchanged, and so is `npx skills add`.

If you installed 0.1.0 in Claude Code, swap the plugin:

```sh
/plugin uninstall hexagonal-skill-builder@arnaud-zg
/plugin install arnaud-zg@arnaud-zg
```

and in a team's `.claude/settings.json`, replace `"hexagonal-skill-builder@arnaud-zg"` with
`"arnaud-zg@arnaud-zg"` under `enabledPlugins`.
