# 🤝 Contributing

Thanks for helping improve `@arnaud-zg/configs`. This is a small, single-package repo, the workflow
is intentionally lightweight.

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
git commit -m "feat(eslint): add a new rule"
git push -u origin my-change
gh pr create --fill
```

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
