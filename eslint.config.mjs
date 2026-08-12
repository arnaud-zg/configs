import tseslint from "typescript-eslint";

import base from "./eslint/base.mjs";

export default tseslint.config(...base, {
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    parserOptions: {
      project: ["./tsconfig.json", "./tsconfig.vitest.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
