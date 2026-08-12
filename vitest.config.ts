import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.test.ts"],
    // tsdown.test.ts's integration test and tsdown-consumer.test.ts both build into this repo's
    // own (real, shared) dist/ — running test files in parallel races the two against each other.
    fileParallelism: false,
  },
});
