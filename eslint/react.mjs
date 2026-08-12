import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

import base from "./base.mjs";

/**
 * `base` plus React, React Hooks, and JSX accessibility rules for `.ts`/`.tsx` files.
 */
export default tseslint.config(
  ...base,
  react.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // TypeScript already enforces prop types via the type system.
      "react/prop-types": "off",
    },
  },
);
