import { afterEach, describe, expect, test } from "vitest";

import { isPeerCheckDisabled, peerCheckToggleEnvVar } from "./peer-check-toggle.mjs";

afterEach(() => {
  delete process.env[peerCheckToggleEnvVar];
});

describe("isPeerCheckDisabled", () => {
  test("is false when the env var is unset", () => {
    delete process.env[peerCheckToggleEnvVar];
    expect(isPeerCheckDisabled()).toBe(false);
  });

  test("is true when the env var is set to any non-empty value", () => {
    process.env[peerCheckToggleEnvVar] = "1";
    expect(isPeerCheckDisabled()).toBe(true);
  });

  test("is false when the env var is set to an empty string", () => {
    process.env[peerCheckToggleEnvVar] = "";
    expect(isPeerCheckDisabled()).toBe(false);
  });
});
