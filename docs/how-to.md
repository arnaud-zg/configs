[🏠 Home](../README.md) · [🚀 Tutorial](./tutorial.md) · **🛠️ How-to** ·
[📖 Reference](./reference.md) · [💡 Explanation](./explanation.md)

# 🛠️ How-to guides

Task recipes. See [Reference](./reference.md) for the full peer-dependency list.

## Lint React code

Use `/react` instead of the base config: it adds React, React Hooks, and JSX accessibility rules.

```sh
pnpm add -D eslint-plugin-react eslint-plugin-jsx-a11y eslint-plugin-react-hooks
```

```js
// eslint.config.mjs
import base from "@arnaud-zg/configs/eslint/react";
```

Pair with `tsconfig/react.json` or a Vite/Storybook/Vitest variant (see
[Reference](./reference.md#tsconfig-variants)).

## Pick a tsconfig variant

- Plain Node → `node.json` (add `-vitest` for tests)
- React web → `react.json`, or `react-vite.json` if bundling with Vite (add `-storybook` / `-vitest`
  as needed)
- React Native → `react-native.json` (same `-storybook` / `-vitest` suffixes)
- Library that emits `.d.ts` → `internal-package.json`

```json
// tsconfig.json
{
  "extends": "@arnaud-zg/configs/tsconfig/react-vite.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"]
}
```

## Configure a library build with tsdown

```sh
pnpm add -D tsdown typescript
```

```ts
// tsdown.config.ts
import { defineLibraryConfig } from "@arnaud-zg/configs/tsdown";

export default defineLibraryConfig({ entry: ["src/index.ts"] });
```

Any `tsdown` option besides `entry` is an optional override. If your package hand-maintains its own
multi-subpath `exports` map, add `exports: false` so the build doesn't overwrite it.

## Add Git hooks with Lefthook

⚠️ Lefthook runs shell commands on every commit/push. Read
[`lefthook/lefthook.yml`](../lefthook/lefthook.yml) in full before wiring it in, and pin the exact
`@arnaud-zg/configs` version you install (see [README](../README.md#-before-you-install)). Open an
issue if anything in there isn't clear.

```sh
pnpm add -D lefthook prettier @commitlint/cli @commitlint/config-conventional
```

```yaml
# lefthook.yml
extends:
  - node_modules/@arnaud-zg/configs/lefthook/lefthook.yml
```

```js
// commitlint.config.mjs
import base from "@arnaud-zg/configs/commitlint";

export default base;
```

Add `"prepare": "lefthook install"` to `package.json` so hooks install on `pnpm install`. Declare
only what you're adding on top of the shared base (protect-`main`, Prettier formatting); `extends`
merges the rest in. The shared `commit-msg` hook shells out to `pnpm exec commitlint --edit`, which
is why it needs its own config. See [Enforce Conventional Commits](#enforce-conventional-commits).

## Enforce Conventional Commits

`@arnaud-zg/configs/commitlint` extends `@commitlint/config-conventional` and additionally requires
a scope (`type(scope): subject`, e.g. `feat(eslint): add a new rule`), matching what the shared
Lefthook `commit-msg` hook expects.

```sh
pnpm add -D @commitlint/cli @commitlint/config-conventional
```

```js
// commitlint.config.mjs
import base from "@arnaud-zg/configs/commitlint";

export default base;
```

To use plain `@commitlint/config-conventional` instead (scope optional), extend that directly rather
than this package's preset.

## Lint Markdown

```sh
pnpm add -D remark-cli remark-preset-lint-recommended
```

```js
// .remarkrc.mjs
import base from "@arnaud-zg/configs/remark";

export default base;
```

```sh
remark . --frail --quiet
```

`--frail` makes warnings fail the run (not just errors); `--quiet` silences per-file "no issues
found" info messages. A `.remarkignore` (`node_modules`, build output, etc.) keeps generated files
out of the run.

This lints Markdown content only, no `--output`/fix mode. Some findings (missing final newline,
spacing) get fixed just by running Prettier; others, like undefined link references, are content
issues Prettier can't resolve on its own (see `CHANGELOG.md`'s `<!--lint disable-->` comment).
Formatting `.md` files is Prettier's job, already covered if you set up
`@arnaud-zg/configs/prettier` (see [Tutorial](./tutorial.md#4-add-prettier)).

## Lint docs with frontmatter or task lists

Use `/remark/docs` instead of the base config if your Markdown has YAML frontmatter (docs sites,
ADRs, blog posts) or GFM task-list checkboxes (`- [ ]`): it adds support for both, so they don't get
misflagged for bad indentation or undefined link references.

```sh
pnpm add -D remark-frontmatter remark-gfm
```

```js
// .remarkrc.mjs
import base from "@arnaud-zg/configs/remark/docs";

export default base;
```

## Run this repo's own tests

For people working on `@arnaud-zg/configs` itself:

```sh
pnpm install
pnpm typecheck && pnpm lint && pnpm lint:md && pnpm format:check && pnpm test
```

## Release a new version

`main` is protected, so the version bump happens on a branch first.

```sh
git checkout -b release/prep
pnpm version patch --no-git-tag-version   # or minor / major
VERSION=$(node -p "require('./package.json').version")
git add package.json pnpm-lock.yaml CHANGELOG.md
git commit -m "chore(release): v$VERSION"
git push -u origin release/prep
gh pr create --fill
```

Move `[Unreleased]` entries in [`CHANGELOG.md`](../CHANGELOG.md) into a dated section before
committing. After the PR merges:

```sh
git checkout main && git pull
VERSION=$(node -p "require('./package.json').version")
NOTES=$(awk -v ver="$VERSION" 'BEGIN{gsub(/\./,"\\.",ver)} $0~"^## \\["ver"\\]"{f=1;next} /^## \[/{f=0} f' CHANGELOG.md)
[ -n "$NOTES" ] || { echo "No CHANGELOG.md entry found for v$VERSION. Was [Unreleased] moved into a dated section?" >&2; exit 1; }
git tag -a "v$VERSION" -m "v$VERSION" -m "$NOTES"
git push --tags
gh release create "v$VERSION" --title "v$VERSION" --notes "$NOTES"
pnpm publish --dry-run   # sanity-check first
pnpm publish
```

The `NOTES` extraction pulls the matching `## [$VERSION]` section out of `CHANGELOG.md`, so the tag
(annotated, not lightweight) and the GitHub Release both carry that version's changelog entry
instead of being empty.
