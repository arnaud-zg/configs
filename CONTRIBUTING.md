# 🤝 Contributing

Thanks for helping improve `@arnaud-zg/configs`. The repo holds the npm package and a Claude Code
plugin marketplace; the workflow is intentionally lightweight for both.

## Setup

```sh
corepack enable
pnpm install
```

`pnpm install` also runs `lefthook install`, wiring up the Git hooks described in
[docs/how-to.md](./docs/how-to.md#add-git-hooks-with-lefthook).

## Making a change

`main` is protected, direct commits are blocked. Work on a branch and open a PR:

```sh
git checkout -b my-change
# ...edit...
pnpm changeset          # unless the change needs no release
git commit -m "feat(eslint): add a new rule"
git push -u origin my-change
gh pr create --fill
```

`pnpm changeset` writes a file into `.changeset/` recording which packages your change affects and
how much to bump them — the npm package, a plugin, or both. Commit it with your work; the release
flow consumes it later. If the change needs no release at all, `pnpm changeset add --empty` says so
explicitly.

Commit messages follow Conventional Commits: `type(scope): description`, types are `feat`, `fix`,
`test`, `refactor`, `chore`, `docs`, `perf` (append `!` before the colon for a breaking change).
Enforced by the `commit-msg` hook.

## Before opening a PR

```sh
pnpm typecheck && pnpm lint && pnpm lint:md && pnpm format:check && pnpm test
```

All five must pass. See [Reference](./docs/reference.md#scripts-for-contributors-to-this-repo) for
what each one does.

## Releasing

See [docs/how-to.md#release-a-new-version](./docs/how-to.md#release-a-new-version).
