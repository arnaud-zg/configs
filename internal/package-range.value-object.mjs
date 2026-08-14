import { caretRangeIsSatisfiedBy } from "./caret-range.mjs";

/** Wraps a caret range string (e.g. "^9.39.4") with the one thing anyone ever does with it. */
export class PackageRange {
  #range;

  /** @param {string} range */
  constructor(range) {
    this.#range = range;
  }

  /** @param {string} version */
  isSatisfiedBy(version) {
    return caretRangeIsSatisfiedBy(this.#range, version);
  }

  toString() {
    return this.#range;
  }
}
