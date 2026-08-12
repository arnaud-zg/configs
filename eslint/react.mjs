import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

import base from "./base.mjs";

/**
 * `base` plus React Hooks rules for `.ts`/`.tsx` files.
 */
export default tseslint.config(...base, {
  files: ["**/*.{ts,tsx}"],
  plugins: {
    "react-hooks": reactHooks,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
  },
});
