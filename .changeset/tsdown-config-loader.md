---
"@arnaud-zg/configs": patch
---

Restore `pnpm build`, which failed with `Failed to load the config file` /
`Cannot find module .../tsdown/base` and took `prepack` — and therefore `pnpm publish` — down with
it. tsdown's default config loader resolves the config file's imports natively and cannot infer the
`.ts` extension `tsdown.config.ts` relies on, so the build now asks for `unrun`, the loader that
file was written against.

Two tests were repaired alongside it: the tsdown integration test now runs `pnpm build` rather than
the tsdown binary directly, so it covers the flags the real build depends on; and the consumer
end-to-end test installs with `--prefer-offline` instead of `--offline`, which failed with
`ERR_PNPM_NO_OFFLINE_TARBALL` whenever a transitive dependency published a patch newer than the
store held.
