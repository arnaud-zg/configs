import frontmatter from "remark-frontmatter";
import gfm from "remark-gfm";

import base from "./index.mjs";

// Docs often use YAML frontmatter, and task-list checkboxes (`- [ ]`) are GFM syntax; without
// these extensions remark-lint parses both as plain Markdown and misflags frontmatter list items
// as bad indentation and `[ ]` as an undefined link reference.
export default {
  ...base,
  plugins: [...base.plugins, frontmatter, gfm],
};
