import { join } from "node:path";

/** The packaged macOS fork has separate browser, app and local workspace data. */
export function isMacFork(packaged: boolean, platform: NodeJS.Platform): boolean {
  return packaged && platform === "darwin";
}

export function forkProfilePath(appData: string): string {
  return join(appData, "OpenBot Fork");
}

export function forkWorkspacePath(home: string, userData: string, explicitProfile: boolean): string {
  return explicitProfile ? join(userData, "workspace") : join(home, "OpenBot Fork");
}
