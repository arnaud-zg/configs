import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/**
 * Framework-agnostic base: recommended JS/TS rules, type-aware rules, and Prettier
 * compatibility. Does not configure `languageOptions.parserOptions` — the consuming
 * project supplies its own `project`/`projectService` pointing at its tsconfig(s).
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/.next/**",
      "**/coverage/**",
      "**/.cache/**",
      "**/.gitignore",
    ],
  },

  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      // Left off: conflicts with Prettier.
      // ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        { allowConstantLoopConditions: true },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },

  {
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },

  // Must be last — turns off stylistic rules that would conflict with Prettier.
  prettier,
);
