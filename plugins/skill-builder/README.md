# skill-builder

Write [Agent Skills](https://code.claude.com/docs/en/skills) that do what they say, and check them
against four rules a script can hold. Every finding comes with its file, its line and its fix.

A skill is a set of instructions a model follows to the letter, so how it is organised is how it
behaves. A link to a page that moved sends it nowhere, a long entry is paid for on every call, and a
script nobody tests was only ever watched.

## Install

**Claude Code**, in one step (Claude Code 2.1.275 or later):

```sh
/plugin install skill-builder --marketplace arnaud-zg/configs
```

or in two, pinned to the version you reviewed:

```sh
/plugin marketplace add arnaud-zg/configs#skill-builder--v0.1.0
/plugin install skill-builder@arnaud-zg
```

**Any agent**, with the [skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills add arnaud-zg/configs --skill skill-builder
```

**A whole team**, from the project's `.claude/settings.json`. Everyone who trusts the folder gets
the marketplace, and the plugin turns on at their next session:

```json
{
  "extraKnownMarketplaces": {
    "arnaud-zg": {
      "source": { "source": "github", "repo": "arnaud-zg/configs", "ref": "skill-builder--v0.1.0" }
    }
  },
  "enabledPlugins": { "skill-builder@arnaud-zg": true }
}
```

## Use it

Ask Claude to _check the skills_, or to _create a skill_ for something, and the skill fires on its
own. To call it by name, use `/skill-builder:skill-builder check` (from the plugin) or
`/skill-builder check` (from the skills CLI).

The check is a Node script, and runs without Claude too:

```sh
node <skill folder>/scripts/check.mjs [path ...] [--suite <script>] [--json]
```

On a project with one skill that holds and one that does not:

```text
Checking 2 skills against named, small, resolves, tested

.claude/skills
  ✓ release-notes
  ✗ tidy-imports
      .claude/skills/tidy-imports/SKILL.md:3  named
      the description never says when to use the skill
      → add a "Use when …" sentence with the words a person would type
      .claude/skills/tidy-imports/scripts/sort.mjs:1  tested
      scripts/sort.mjs is reached by no test
      → write a test that imports or runs it

✗ 2 findings in 1 of 2 skills.
```

It exits 0 when every skill holds, 1 on a finding, and 2 when there is nothing to check, so it can
gate a commit hook or a CI job as it is.

## The four rules

| Rule       | Says                                                                                    |
| ---------- | --------------------------------------------------------------------------------------- |
| `named`    | `SKILL.md` is named for its folder in lowercase-hyphen words, and says when to use it   |
| `small`    | the entry's body fits in 150 lines, and every other page in 300                         |
| `resolves` | every relative link, heading anchor, `${CLAUDE_SKILL_DIR}` path and cited story exists  |
| `tested`   | every script under `scripts/` is reached by a test; with `--suite`, every test is in it |

Each one is there because a skill once broke it and a model followed it anyway. The stories are in
[`evidence.md`](skills/skill-builder/evidence.md), and seven mistakes no script can see are in
[`guards.md`](skills/skill-builder/guards.md).

## 🔒 Know what you're installing

- **It reads, and never writes.** The check reads the files under your skills folders and
  `package.json` when you pass `--suite`. It changes nothing and opens no connection.
- **It needs Node only**, with nothing to download, and ships no hooks and no MCP server.
- **It pre-approves one command**: `node ${CLAUDE_SKILL_DIR}/scripts/check.mjs`, through the skill's
  `allowed-tools`, so the check runs without a permission prompt. Everything else asks.

Read [`SKILL.md`](skills/skill-builder/SKILL.md) and [`scripts/`](skills/skill-builder/scripts/)
before you install it, as you would any dependency. Claude reads `SKILL.md`, not this page.
