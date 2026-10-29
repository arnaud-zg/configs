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

Claude Code plugin repositories need it for exactly that reason: `SKILL.md` and agent files start
with YAML frontmatter that the base config misreads as an indented list.
[arnaud-zg/skills](https://github.com/arnaud-zg/skills) uses it.

## Run this repo's own tests

For people working on `@arnaud-zg/configs` itself:

```sh
pnpm install
pnpm typecheck && pnpm lint && pnpm lint:md && pnpm format:check && pnpm test
```

## Release a new version

Three commands release the npm package. Changesets is the entry point, and you never edit a version,
a changelog or a tag by hand.

```sh
pnpm changeset          # 1. in the PR that makes the change
pnpm release:version    # 2. opens the release PR; review and merge it
pnpm release            # 3. after the merge: publishes, tags, creates the GitHub releases
```

### 1. Describe the change

Any pull request that should show up in a release carries a changeset:

```sh
pnpm changeset
```

It asks how much to bump the package, then writes a Markdown file into `.changeset/`. Commit that
file with your work. To skip the prompts:

```sh
pnpm changeset add --minor @arnaud-zg/configs -m "Add the react-native tsconfig variant"
```

For a change that needs no release at all, `pnpm changeset add --empty` records that decision
explicitly.

### 2. Open the release PR

```sh
pnpm release:version
```

Run it with a clean working tree. It switches to an up-to-date `main` and, if any changesets are
pending, does the rest:

| Step                                | What it does                                                           |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `git switch -c release/<timestamp>` | `main` is protected, so versions only reach it through a PR            |
| `changeset version`                 | consumes `.changeset/*.md`, bumps `package.json`, writes the changelog |
| `node scripts/sync-versions.mjs`    | rewrites the pinned `@arnaud-zg/configs@x.y.z` examples in the docs    |
| `pnpm install --lockfile-only`      | refreshes the lockfile                                                 |
| commit, push, `gh pr create`        | opens the PR, listing the bump                                         |

With no pending changesets it says so and stops. Review the PR, then merge it.

### 3. Release, after the PR merges

```sh
pnpm release
```

It switches to an up-to-date `main` and checks whether the package's current version has a GitHub
release yet. If not, it builds, publishes to npm with `changeset publish --no-git-tag`, tags
`v<version>` annotated with its changelog section, pushes the tag and creates the GitHub release
with that section as its notes.

The npm publish runs before anything is tagged, so a failed publish leaves nothing half-released.
Every step is safe to repeat: fix whatever stopped it and run `pnpm release` again. With nothing
new, it says so and stops.

It needs `gh auth login` and `npm login`. `changeset publish` runs with `--no-git-tag`, because its
monorepo tag format (`@arnaud-zg/configs@0.3.1`) doesn't match `v<version>`.

## Use these configs across a repository

To give another repository the same tooling, add the package and every peer at once, then point each
tool at its subpath. [arnaud-zg/skills](https://github.com/arnaud-zg/skills) is set up exactly this
way.

```sh
pnpm add -D @arnaud-zg/configs prettier @ianvs/prettier-plugin-sort-imports \
  prettier-plugin-packagejson eslint @eslint/js typescript-eslint eslint-config-prettier typescript \
  remark-cli remark-preset-lint-recommended remark-frontmatter remark-gfm lefthook @commitlint/cli \
  @commitlint/config-conventional
```

| File                    | Content                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `package.json`          | `"prettier": "@arnaud-zg/configs/prettier"`                                         |
| `eslint.config.mjs`     | spread `@arnaud-zg/configs/eslint`, plus `parserOptions.project` for your tsconfigs |
| `tsconfig.json`         | `"extends": "@arnaud-zg/configs/tsconfig/base.json"`, with your own `include`       |
| `.remarkrc.mjs`         | `export default` from `@arnaud-zg/configs/remark/docs`                              |
| `commitlint.config.mjs` | `export default` from `@arnaud-zg/configs/commitlint`                               |
| `lefthook.yml`          | `extends: [node_modules/@arnaud-zg/configs/lefthook/lefthook.yml]`                  |

Leave the config files themselves out of `tsconfig.json`'s `include`: the subpaths ship no type
declarations, so a strict typecheck reports them as untyped modules.
