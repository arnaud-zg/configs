# What the words must guard against

**The four rules hold a skill's shape. These hold its words, and no check can.** Each is a mistake a
model made while following a skill whose every rule held. Read them before a step, an output or a
script is written, because a clean check says nothing about any of them.

| Guard                            | Says                                                                                                                                                                                                                   | Why         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **read, never reckoned**         | Every number a skill has the model write (a time, a duration, a line, a count) is copied from something that prints it, and the skill names that thing. Never computed from another number, recalled, or written early | (why: E-03) |
| **set aside is not zero**        | An output that shows a measurement says which of three it is: measured; set aside, with what it would read and why; or not measured. It never draws the last two as a measured zero or a blank                         | (why: E-04) |
| **edges tested**                 | A script that draws an output is tested on partial, set-aside and absent inputs as well as full ones, because those are the inputs it misdraws                                                                         | (why: E-04) |
| **inputs before the job**        | A step that starts a long job checks every input the job would refuse before starting it, not after the first refusal                                                                                                  | (why: E-05) |
| **the other system's source**    | A step that changes something another system builds on ends by reading that system's own source for what it does with the change. A test of the piece alone cannot see what the system builds from it                  | (why: E-06) |
| **one edit, counted**            | An edit a script makes states how many places it changes and fails on any other count. A replacement that can match twice is two edits                                                                                 | (why: E-07) |
| **a README points at its proof** | Every number in a README names the record it came from, and every output shown in it is copied from a real run, never composed. A figure nobody can point at is cut                                                    | (why: E-08) |

**Guidance, not rules, on purpose.** A check can see a page that is too long or a link to nothing;
it cannot see a number that was guessed, a zero that was set aside, or a test that never fed a
script its edge. Written as rules, these would pass on every skill and prove nothing. When one
becomes checkable, it moves into `scripts/rules.mjs` with its test, in the same change.
