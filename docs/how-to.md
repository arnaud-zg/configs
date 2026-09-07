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
`@arnaud-zg/configs` version you install (see
[README](../README.md#-security-know-what-youre-installing)). Open an issue if anything in there
isn't clear.

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

This repository uses it for exactly that reason: `plugins/` and `templates/` carry `SKILL.md` and
agent files whose YAML frontmatter the base config misreads as an indented list.

## Run this repo's own tests

For people working on `@arnaud-zg/configs` itself:

```sh
pnpm install
pnpm typecheck && pnpm lint && pnpm lint:md && pnpm format:check && pnpm test
```

## Release a new version

One flow releases everything — the npm package and every plugin. Changesets is the entry point, and
you never edit a version or a changelog by hand.

### 1. Describe the change

Any pull request that should show up in a release carries a changeset:

```sh
pnpm changeset
```

It asks which packages changed and how much to bump them, then writes a Markdown file into
`.changeset/`. Commit that file with your work. Plugins appear in the list next to
`@arnaud-zg/configs` because each one has a private `package.json` beside its `plugin.json` — see
[why](#why-plugins-carry-a-packagejson).

For a change that needs no release at all, `pnpm changeset add --empty` records that decision
explicitly.

### 2. Version, on a branch

`main` is protected, so versioning happens on a branch:

```sh
git checkout -b release/prep
pnpm release:version
git commit -am "chore(release): version packages"
git push -u origin release/prep
gh pr create --fill
```

`pnpm release:version` is three steps:

| Step                             | What it does                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `changeset version`              | consumes `.changeset/*.md`, bumps every affected `package.json`, writes the changelogs                                                                 |
| `node scripts/sync-versions.mjs` | copies each plugin's new version into its `plugin.json` and marketplace entry, and rewrites the pinned `@arnaud-zg/configs@x.y.z` examples in the docs |
| `pnpm install --lockfile-only`   | refreshes the lockfile for the bumped workspace versions                                                                                               |

The sync step exists because changesets only understands `package.json`. `claude plugin tag` refuses
to tag when a plugin's manifest and its marketplace entry disagree, so this is what keeps them in
step.

### 3. Publish, after the PR merges

```sh
git checkout main && git pull
pnpm release
git push --follow-tags
gh release create "v$(node -p "require('./package.json').version")" --generate-notes
```

`pnpm release` builds, publishes to npm, then tags:

| Artifact             | Tag              | Created by                                                          |
| -------------------- | ---------------- | ------------------------------------------------------------------- |
| `@arnaud-zg/configs` | `v0.3.1`         | `scripts/release-tags.mjs`, annotated with its changelog section    |
| each plugin          | `<name>--v0.2.0` | `claude plugin tag`, which checks manifest agreement before tagging |

`changeset publish` runs with `--no-git-tag`, because its monorepo tag format
(`@arnaud-zg/configs@0.3.1`) matches neither convention this repository uses. `claude plugin tag`
refuses to run on a dirty tree, so release from a clean `main`.

### What a plugin release actually ships

Nothing is uploaded anywhere. The marketplace _is_ this git repository, so a plugin reaches
consumers the moment the change lands on `main` and they run `claude plugin marketplace update`. The
version and the tag do two narrower jobs: they make the plugin resolvable by a dependency range like
`ts-base@^1.2.0`, and they give a `git-subdir` entry something to pin.

### Why plugins carry a package.json

A plugin's real manifest is `.claude-plugin/plugin.json`. The `package.json` beside it is private,
never published, and exists only so changesets can see the plugin as a workspace package and version
it; `scripts/sync-versions.mjs` copies the result across. Keeping two files in step is the price of
one release flow instead of two — the alternative was versioning every plugin by hand.
