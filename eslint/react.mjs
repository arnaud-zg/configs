import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

import base from "./base.mjs";

// eslint-plugin-react types `configs.flat` as a plain Record, so indexing it is `T | undefined`
// under noUncheckedIndexedAccess even though "recommended" always exists at runtime.
const reactRecommended = react.configs.flat.recommended;
if (!reactRecommended) {
  throw new Error("eslint-plugin-react: configs.flat.recommended not found");
}

/**
 * `base` plus React, React Hooks, and JSX accessibility rules for `.ts`/`.tsx` files.
 */
export default tseslint.config(...base, reactRecommended, jsxA11y.flatConfigs.recommended, {
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
});
