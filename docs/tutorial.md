[🏠 Home](../README.md) · **🚀 Tutorial** · [🛠️ How-to](./how-to.md) ·
[📖 Reference](./reference.md) · [💡 Explanation](./explanation.md)

# 🚀 Getting started

Wire up ESLint, Prettier, and a tsconfig in a fresh TypeScript project. Five steps, top to bottom.

## 1. Install

Pin an exact version rather than a range, so updates only land when you choose to bump it. See the
[README](../README.md#-security-know-what-youre-installing) for why, and review the files before
installing.

```sh
pnpm add -D @arnaud-zg/configs@0.3.0 typescript
```

## 2. Add a tsconfig

```json
// tsconfig.json
{
  "extends": "@arnaud-zg/configs/tsconfig/node.json",
  "include": ["src"]
}
```

## 3. Add ESLint

```sh
pnpm add -D eslint @eslint/js typescript-eslint eslint-config-prettier
```

```js
// eslint.config.mjs
import base from "@arnaud-zg/configs/eslint";
import tseslint from "typescript-eslint";

export default tseslint.config(...base, {
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
  },
});
```

## 4. Add Prettier

```sh
pnpm add -D prettier @ianvs/prettier-plugin-sort-imports prettier-plugin-packagejson
```

```json
// package.json
{ "prettier": "@arnaud-zg/configs/prettier" }
```

## 5. Verify

```sh
pnpm exec eslint .
pnpm exec prettier --check .
```

Done. You have consistent linting and formatting. For React, a library build, or Git hooks, see
[How-to guides](./how-to.md).
