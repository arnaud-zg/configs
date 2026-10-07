# @arnaud-zg/configs

Shareable dev-tooling configs (ESLint, Prettier, tsconfig, tsdown, Lefthook) published as one npm
package with subpath exports. Full docs: [README.md](./README.md) and [docs/](./docs/) (Diataxis:
tutorial, how-to, reference, explanation).

## Releasing

See [docs/how-to.md#release-a-new-version](./docs/how-to.md#release-a-new-version) for the exact
commands. Key constraint: `main` is protected by a Lefthook hook, so the version bump must happen on
a branch and go through a PR before tagging and `pnpm publish`. Don't try to bump/commit/tag
directly on `main`.

## Plugins and skills

To add or change a plugin or skill, follow [docs/plugins/how-to.md](./docs/plugins/how-to.md). Draft
in `~/.claude/skills/<name>/`, evaluate, then move it into `plugins/`. Run
`claude plugin validate . --strict` before committing.

## Before committing

Run `pnpm typecheck && pnpm lint && pnpm lint:md && pnpm format:check && pnpm test`. All five must
pass.
