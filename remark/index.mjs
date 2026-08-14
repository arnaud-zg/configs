import recommended from "remark-preset-lint-recommended";

import { subpathPeerRegistry } from "../internal/subpath-peer-registry.mjs";
import pkg from "../package.json" with { type: "json" };

const remarkPeers = subpathPeerRegistry.requirementsFor(
  "./remark",
  /** @type {Record<string, string>} */ (pkg.peerDependencies),
);
remarkPeers.assertSatisfied("@arnaud-zg/configs/remark");

/**
 * Framework-agnostic base: remark-lint's recommended rule set (common Markdown correctness
 * issues, like broken reference links, duplicate headings, hard tabs), nothing more opinionated
 * layered on top.
 */
export default {
  plugins: [recommended],
};
