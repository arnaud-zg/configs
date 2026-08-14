/** Set to any non-empty value to skip peer checks everywhere: global and all-or-nothing on purpose. */
export const peerCheckToggleEnvVar = "ARNAUD_ZG_CONFIGS_SKIP_PEER_CHECK";

export function isPeerCheckDisabled() {
  return Boolean(process.env[peerCheckToggleEnvVar]);
}
