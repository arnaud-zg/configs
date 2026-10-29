# Moved to arnaud-zg/skills

The `arnaud-zg` plugin, and its `hexagonal-skill-builder` skill, now live in
[arnaud-zg/skills](https://github.com/arnaud-zg/skills/tree/main/plugins/arnaud-zg).

Install it from there. In Claude Code:

```sh
/plugin uninstall arnaud-zg@arnaud-zg
/plugin marketplace remove arnaud-zg
/plugin marketplace add arnaud-zg/skills
/plugin install arnaud-zg@arnaud-zg-skills
```

In any agent, through the skills CLI:

```sh
npx skills add arnaud-zg/skills --skill hexagonal-skill-builder
```

The `arnaud-zg` marketplace in this repository still serves the plugin from its new home until the
next minor release of `@arnaud-zg/configs`, then goes away.
