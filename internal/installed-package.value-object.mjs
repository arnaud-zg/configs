/** Whether, and at what version, a package is installed: a pure value, no filesystem access. */
export class InstalledPackage {
  name;
  #version;

  /**
   * @param {string} name
   * @param {string | undefined} version
   */
  constructor(name, version) {
    this.name = name;
    this.#version = version;
  }

  /** @param {string} name */
  static absent(name) {
    return new InstalledPackage(name, undefined);
  }

  isPresent() {
    return this.#version !== undefined;
  }

  /**
   * @template T
   * @param {(version: string) => T} whenPresent
   * @param {() => T} whenAbsent
   * @returns {T}
   */
  match(whenPresent, whenAbsent) {
    return this.#version === undefined ? whenAbsent() : whenPresent(this.#version);
  }
}
