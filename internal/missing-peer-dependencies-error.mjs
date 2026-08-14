/** @typedef {{ problems: () => string[], installCommand: () => string }} ProblemReport */

/** Thrown by PeerRequirementList#assertSatisfied. Takes a ProblemReport structurally, no import needed. */
export class MissingPeerDependenciesError extends Error {
  subpath;
  problems;

  /**
   * @param {string} subpath
   * @param {ProblemReport} report
   */
  constructor(subpath, report) {
    const problems = report.problems();
    super(
      [
        `${subpath} is missing required peer dependencies:`,
        ...problems,
        "",
        `  ${report.installCommand()}`,
      ].join("\n"),
    );
    this.name = "MissingPeerDependenciesError";
    this.subpath = subpath;
    this.problems = problems;
  }
}
