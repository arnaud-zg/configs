import { PeerRequirementList } from "./peer-requirement-list.mjs";
import { PeerRequirement } from "./peer-requirement.value-object.mjs";

const peerNamesBySubpath = {
  "./eslint": ["eslint", "@eslint/js", "typescript-eslint", "eslint-config-prettier"],
  "./eslint/react": ["eslint-plugin-react", "eslint-plugin-jsx-a11y", "eslint-plugin-react-hooks"],
  "./prettier": ["prettier", "@ianvs/prettier-plugin-sort-imports", "prettier-plugin-packagejson"],
  "./tsdown": ["tsdown", "typescript"],
  "./lefthook/lefthook.yml": ["lefthook", "prettier", "@commitlint/cli"],
  "./remark": ["remark-cli", "remark-preset-lint-recommended"],
  "./remark/docs": [
    "remark-cli",
    "remark-preset-lint-recommended",
    "remark-frontmatter",
    "remark-gfm",
  ],
  "./commitlint": ["@commitlint/cli", "@commitlint/config-conventional"],
};

/** Subpath → peer names, shared with package.test.ts; the source of every PeerRequirementList. */
class SubpathPeerRegistry {
  subpaths() {
    return /** @type {(keyof typeof peerNamesBySubpath)[]} */ (Object.keys(peerNamesBySubpath));
  }

  /** @param {keyof typeof peerNamesBySubpath} subpath */
  peerNames(subpath) {
    return peerNamesBySubpath[subpath];
  }

  /**
   * @param {keyof typeof peerNamesBySubpath} subpath
   * @param {Record<string, string>} peerDependencies
   */
  requirementsFor(subpath, peerDependencies) {
    const requirements = this.peerNames(subpath).map((name) =>
      this.#requirementFor(subpath, name, peerDependencies),
    );
    return new PeerRequirementList(requirements);
  }

  /**
   * @param {string} subpath
   * @param {string} name
   * @param {Record<string, string>} peerDependencies
   */
  #requirementFor(subpath, name, peerDependencies) {
    const range = peerDependencies[name];
    if (!range) {
      throw new Error(`"${name}" (declared for ${subpath}) has no range in peerDependencies`);
    }
    return new PeerRequirement(name, range);
  }
}

export const subpathPeerRegistry = new SubpathPeerRegistry();
