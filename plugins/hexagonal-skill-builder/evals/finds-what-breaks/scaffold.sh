#!/usr/bin/env bash
# Two skills: one holds every rule, one links to a page that is not there.
set -euo pipefail
mkdir -p .claude/skills/release-notes .claude/skills/tidy-imports
printf -- '---\nname: release-notes\ndescription: Drafts release notes. Use when asked to write them.\n---\n\n# Release notes\n' \
  > .claude/skills/release-notes/SKILL.md
printf -- '---\nname: tidy-imports\ndescription: Sorts imports. Use when imports need tidying.\n---\n\n# Tidy imports\n\nFollow [the order](order.md).\n' \
  > .claude/skills/tidy-imports/SKILL.md
