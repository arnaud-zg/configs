[🏠 Home](../README.md) · [🚀 Tutorial](./tutorial.md) · [🛠️ How-to](./how-to.md) ·
[📖 Reference](./reference.md) · **💡 Explanation**

# 💡 Explanation

## Why one package, not five

A team wants the same house style installed consistently, not to pick configs à la carte across
separate repos. Five packages means five versions and five changelogs to keep in sync for no benefit
at this size. The `exports` map lets each subpath resolve independently from one package instead
(same model as [@vercel/style-guide](https://github.com/vercel/style-guide)).

## Why every peer dependency is optional

`peerDependenciesMeta.<name>.optional: true` on every peer means installing this package alone pulls
in nothing else. A consumer using only `/prettier` never gets nudged about `eslint` or `tsdown`.

## Why no build step and no barrel file

The package ships its source files as-is. Nothing needs transpiling, and a barrel `index.ts` would
force every consumer to pull in every subpath's dependencies just to import one: importing it just
for `/prettier` would still try to load `/eslint`'s module and crash on a missing `@eslint/js` peer
that consumer never installed. Tree-shaking usually handles barrel files fine, but "usually" isn't
good enough here: when a bundler doesn't fully eliminate the unused re-exports, a consumer ends up
with every subpath's code (and its peer requirements) pulled in regardless. Not worth the risk for a
package whose whole point is "install only what you use."

## Why `tsdown.config.ts` in this repo passes `exports: false`

`tsdown`'s shared config auto-generates `package.json`'s `exports` map from `entry` by default,
convenient for a library with one entry point. This package hand-maintains its own 17-entry
`exports` map, so its self-build overrides that default off. This isn't hypothetical: it happened
once and collapsed the real map down to one entry before being caught.

## The `${configDir}` limitation

TypeScript's `${configDir}` template is meant to let a base tsconfig's paths resolve relative to
whatever extends it, but with this package's target TypeScript version, it only expands inside
`compilerOptions` fields, not top-level `include`/`exclude`. Several variants use it there anyway,
so a project extending them and relying on the inherited `include` will hit "No inputs were found."
Always declare your own `include`/`exclude`.

## Why releases are manual, no CI

There's only one package here, no multiple packages whose versions need consolidating, no
cross-package changelog to generate. At that scale, a CI release pipeline is machinery with nothing
proportionate to run it for. A hand-maintained `CHANGELOG.md` and the native `pnpm version` /
`pnpm publish` commands are enough, and every release already goes through a reviewed PR regardless
(see below), so CI wouldn't add a review step that doesn't already exist. Revisit this if the repo
ever grows into multiple packages that need coordinated releases.

## Why `main` is protected via Lefthook

This is an opinionated choice, not a default: direct commits to `main` are not acceptable, every
change goes through a branch and a PR. `git commit --no-verify` can still bypass the hook, that's
intentional too, it's a local, client-side check, not a security boundary. The point isn't to make
bypassing impossible, it's to make bypassing something you have to choose to do, not something that
happens by accident. Real enforcement (blocking a bypassed push, not just a local commit) needs
GitHub branch protection on `main` configured server-side; the Lefthook hook alone can't provide
that.
