import { PeerRequirementList } from "./peer-requirement-list.mjs";
import { PeerRequirement } from "./peer-requirement.value-object.mjs";
import { peerNamesBySubpath } from "./subpath-peers.config.mjs";

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
