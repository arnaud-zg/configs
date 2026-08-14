import frontmatter from "remark-frontmatter";
import gfm from "remark-gfm";

import { subpathPeerRegistry } from "../internal/subpath-peer-registry.mjs";
import pkg from "../package.json" with { type: "json" };
import base from "./index.mjs";

const remarkDocsPeers = subpathPeerRegistry.requirementsFor(
  "./remark/docs",
  /** @type {Record<string, string>} */ (pkg.peerDependencies),
);
remarkDocsPeers.assertSatisfied("@arnaud-zg/configs/remark/docs");

// Docs often use YAML frontmatter, and task-list checkboxes (`- [ ]`) are GFM syntax; without
// these extensions remark-lint parses both as plain Markdown and misflags frontmatter list items
// as bad indentation and `[ ]` as an undefined link reference.
export default {
  ...base,
  plugins: [...base.plugins, frontmatter, gfm],
};
