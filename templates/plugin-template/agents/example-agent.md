---
name: example-agent
description: TODO — when should Claude delegate to this subagent instead of doing the work itself?
tools:
  - Read
  - Grep
  - Glob
---

TODO: the system prompt for this subagent.

A subagent runs in its own context window and reports back a summary. Use one when a task involves
reading a lot of material that the main conversation does not need to keep.
