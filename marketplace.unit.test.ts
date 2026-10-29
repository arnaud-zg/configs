import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const root = import.meta.dirname;

const marketplace = JSON.parse(
  readFileSync(path.join(root, ".claude-plugin", "marketplace.json"), "utf8"),
) as { name: string; plugins: { name: string; source: unknown }[] };

// The plugin moved to arnaud-zg/skills. Until the next minor release, this marketplace keeps the
// name people added it under and serves the plugin from its new home, so their installs keep
// updating while they switch over.
describe("the arnaud-zg marketplace, kept as a redirect", () => {
  test("keeps its old name, so existing installs still resolve it", () => {
    expect(marketplace.name).toBe("arnaud-zg");
  });

  test("serves every plugin from arnaud-zg/skills, and none from this repository", () => {
    expect(marketplace.plugins).toEqual([
      expect.objectContaining({
        name: "arnaud-zg",
        source: {
          source: "git-subdir",
          url: "https://github.com/arnaud-zg/skills.git",
          path: "plugins/arnaud-zg",
        },
      }),
    ]);
  });
});
