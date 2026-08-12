import { defineConfig } from "eslint/config";

import base from "./eslint/base.mjs";

export default defineConfig(...base, {
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    parserOptions: {
      project: ["./tsconfig.json", "./tsconfig.vitest.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
