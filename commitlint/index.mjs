import { subpathPeerRegistry } from "../internal/subpath-peer-registry.mjs";
import pkg from "../package.json" with { type: "json" };

const commitlintPeers = subpathPeerRegistry.requirementsFor(
  "./commitlint",
  /** @type {Record<string, string>} */ (pkg.peerDependencies),
);
commitlintPeers.assertSatisfied("@arnaud-zg/configs/commitlint");

/**
 * Conventional Commits, with a mandatory scope (`type(scope): subject`). config-conventional
 * alone leaves scope optional.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-empty": [2, "never"],
  },
};
