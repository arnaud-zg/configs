---
name: example-skill
description:
  TODO — describe WHEN Claude should reach for this, not what it is. Include the phrases a user
  would actually type ("review my migrations", "set up tracing"). This string is the only thing
  Claude matches against, so be concrete and specific.
---

# Example skill

TODO: replace this file.

A skill is a prompt Claude loads on demand. Write it as instructions addressed to Claude, not as
documentation addressed to a human.

## When to use this

- TODO: the situation that should trigger it
- TODO: a second situation

## Steps

1. TODO: the first thing Claude should do
2. TODO: the second

## Notes

- Keep the body short. Everything here costs context every time the skill fires.
- Put long material in sibling files (`reference.md`, `scripts/`) and link to it from here so Claude
  reads it only when it actually needs it.
