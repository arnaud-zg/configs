import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

import { subpathPeerRegistry } from "../internal/subpath-peer-registry.mjs";
import pkg from "../package.json" with { type: "json" };
import base from "./base.mjs";

const eslintReactPeers = subpathPeerRegistry.requirementsFor(
  "./eslint/react",
  /** @type {Record<string, string>} */ (pkg.peerDependencies),
);
eslintReactPeers.assertSatisfied("@arnaud-zg/configs/eslint/react");

// eslint-plugin-react types `configs.flat` as a plain Record, so indexing it is `T | undefined`
// under noUncheckedIndexedAccess even though "recommended" always exists at runtime.
const reactRecommended = react.configs.flat.recommended;
if (!reactRecommended) {
  throw new Error("eslint-plugin-react: configs.flat.recommended not found");
}

const reactJsxRuntime = react.configs.flat["jsx-runtime"];
if (!reactJsxRuntime) {
  throw new Error("eslint-plugin-react: configs.flat['jsx-runtime'] not found");
}

/**
 * `base` plus React, React Hooks, and JSX accessibility rules for `.ts`/`.tsx` files.
 *
 * Includes eslint-plugin-react's `jsx-runtime` config since this package targets the
 * automatic JSX runtime, where `react/react-in-jsx-scope` and `react/jsx-uses-react`
 * would otherwise false-positive on every file.
 */
export default defineConfig(
  ...base,
  reactRecommended,
  reactJsxRuntime,
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
