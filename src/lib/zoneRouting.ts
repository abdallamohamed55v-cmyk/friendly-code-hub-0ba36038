/** @doc Zone routing helpers — Cleopatra removed; kept as no-op stubs so existing call sites keep compiling. */

export const CLEOPATRA_PREFIX = "";

export function isCleopatraPath(_pathname: string): boolean {
  return false;
}

export function stripZonePrefix(pathname: string): string {
  return pathname || "/";
}

export function pathForZone(path: string, _currentPathname: string): string {
  return path;
}
