const KEY_ZOO = 'crimson.zoo.enabled';

function readBoolFlag(value) {
  if (value === null || value === undefined) return null;
  const v = String(value).trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return null;
}

export function readRuntimeFlags() {
  const flags = {
    zooEnabled: false,
  };
  if (typeof window === 'undefined') return flags;

  const params = new URLSearchParams(window.location.search);
  const localRaw = window.localStorage.getItem(KEY_ZOO);
  const localFlag = readBoolFlag(localRaw);

  if (localFlag !== null) flags.zooEnabled = localFlag;

  const queryFlag = readBoolFlag(params.get('zoo'));
  if (queryFlag !== null) {
    flags.zooEnabled = queryFlag;
    window.localStorage.setItem(KEY_ZOO, queryFlag ? '1' : '0');
  }

  return flags;
}

export function setZooFlagEnabled(enabled) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY_ZOO, enabled ? '1' : '0');
}
