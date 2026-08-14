const CARET_RANGE = /^\^(\d+)\.(\d+)\.(\d+)$/;
const VERSION = /^(\d+)\.(\d+)\.(\d+)/;

/** @typedef {[number, number, number]} Triple */

/**
 * Whether a version satisfies a caret range (`^X.Y.Z`), the only range shape this package's own
 * peerDependencies ever declares. Follows npm's actual rule: nothing left of the leftmost
 * non-zero component may change, so `^0.21.10` (a real range in this repo, tsdown's) only allows
 * patch and further-minor bumps within 0.21.x, not 0.22.0.
 * @param {string} range
 * @param {string} version
 * @returns {boolean}
 */
export function caretRangeIsSatisfiedBy(range, version) {
  const rangeMatch = CARET_RANGE.exec(range);
  if (!rangeMatch) {
    throw new Error(`unsupported range "${range}" (only ^X.Y.Z caret ranges are supported)`);
  }
  const versionMatch = VERSION.exec(version);
  if (!versionMatch) return false;

  const floor = toTriple(rangeMatch);
  const actual = toTriple(versionMatch);
  const ceiling = caretCeiling(floor);
  return compareTriples(actual, floor) >= 0 && compareTriples(actual, ceiling) < 0;
}

/**
 * @param {RegExpExecArray} match
 * @returns {Triple}
 */
function toTriple(match) {
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * @param {Triple} floor
 * @returns {Triple}
 */
function caretCeiling([major, minor, patch]) {
  if (major > 0) return [major + 1, 0, 0];
  if (minor > 0) return [0, minor + 1, 0];
  return [0, 0, patch + 1];
}

/**
 * @param {Triple} a
 * @param {Triple} b
 */
function compareTriples([aMajor, aMinor, aPatch], [bMajor, bMinor, bPatch]) {
  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}
