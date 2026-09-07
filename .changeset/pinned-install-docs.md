---
"@arnaud-zg/configs": patch
---

Install commands now pin an exact version instead of a range, and the README and how-to guides add
an explicit security-review note: read the files you're installing, especially
`lefthook/lefthook.yml`, before adding this as a dependency.

The release flow rewrites those pinned install examples to the new version as part of versioning, so
they can't drift behind an actual release.
