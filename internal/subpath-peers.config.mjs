/**
 * Subpath -> required peer package names. Edit this to add, remove, or change a subpath's peers;
 * nothing else needs to change. Each name listed here must also have a matching, optional entry
 * in package.json's peerDependencies with the version range to enforce -- package.unit.test.ts
 * checks both directions (every peer here is declared in package.json, and every peer declared in
 * package.json is required by some subpath here).
 */
export const peerNamesBySubpath = {
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
