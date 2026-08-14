import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    // tsdown/base.integration.test.ts and tsdown-consumer.e2e.test.ts both build into this
    // repo's own (real, shared) dist/; running test files in parallel races the two against
    // each other.
    fileParallelism: false,
  },
});
