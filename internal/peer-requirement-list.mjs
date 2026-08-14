import { MissingPeerDependenciesError } from "./missing-peer-dependencies-error.mjs";
import { isPeerCheckDisabled, peerCheckToggleEnvVar } from "./peer-check-toggle.mjs";
import { resolveInstalledPackage } from "./resolve-installed-package.mjs";

/** A collection of PeerRequirement: the one place this domain checks them against reality. */
export class PeerRequirementList {
  #requirements;

  /** @param {import("./peer-requirement.value-object.mjs").PeerRequirement[]} requirements */
  constructor(requirements) {
    this.#requirements = requirements;
  }

  problems() {
    /** @type {string[]} */
    const problems = [];
    for (const requirement of this.#requirements) {
      const installed = resolveInstalledPackage(requirement.name);
      const problem = requirement.checkAgainst(installed);
      if (problem !== undefined) problems.push(problem);
    }
    return problems;
  }

  installCommand() {
    const specifiers = this.#requirements.map((requirement) => requirement.toInstallSpecifier());
    return `pnpm add -D ${specifiers.join(" ")}`;
  }

  /** @param {string} subpath */
  assertSatisfied(subpath) {
    if (isPeerCheckDisabled()) {
      console.warn(`${subpath}: peer checks skipped (${peerCheckToggleEnvVar} is set)`);
      return;
    }
    if (this.problems().length === 0) return;
    throw new MissingPeerDependenciesError(subpath, this);
  }
}
