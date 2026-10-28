/** The personal macOS app must not install releases from the upstream project. */
export function forkAllowsApplicationUpdates(platform: NodeJS.Platform): boolean {
  return platform !== "darwin";
}
