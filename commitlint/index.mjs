/**
 * Conventional Commits, with a mandatory scope (`type(scope): subject`) — config-conventional
 * alone leaves scope optional.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-empty": [2, "never"],
  },
};
