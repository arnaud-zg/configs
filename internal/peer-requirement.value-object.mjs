import { PackageRange } from "./package-range.value-object.mjs";

/** One declared peer and the range it must satisfy: a pure value; checking happens elsewhere. */
export class PeerRequirement {
  name;
  #range;

  /**
   * @param {string} name
   * @param {string} range
   */
  constructor(name, range) {
    this.name = name;
    this.#range = new PackageRange(range);
  }

  /**
   * @param {import("./installed-package.value-object.mjs").InstalledPackage} installedPackage
   * @returns {string | undefined} a one-line problem description, or undefined if satisfied
   */
  checkAgainst(installedPackage) {
    return installedPackage.match(
      (version) =>
        this.#range.isSatisfiedBy(version)
          ? undefined
          : `  ✗ ${this.name}  ${version} installed, needs ${this.#range}`,
      () => `  ✗ ${this.name}  not installed (needs ${this.#range})`,
    );
  }

  toInstallSpecifier() {
    return `${this.name}@${this.#range}`;
  }
}
