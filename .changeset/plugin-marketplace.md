---
"@arnaud-zg/configs": patch
---

The repository is now a Claude Code plugin marketplace as well as an npm package:
`.claude-plugin/marketplace.json`, an empty `plugins/` catalogue, `templates/plugin-template`, and
documentation under `docs/plugins/`. None of it ships in the npm tarball — `docs/plugins/` is
excluded from `files`, and the rest was never in it.

The repo's own `.remarkrc.mjs` now extends `@arnaud-zg/configs/remark/docs` instead of the base
preset, so the YAML frontmatter in `SKILL.md` and agent files is parsed rather than misflagged as
indented list items.
