import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";
import { forkAllowsApplicationUpdates } from "./fork-update-policy";
import { createDisabledUpdateAdapter, UpdateService } from "./update-service";

describe("personal macOS update policy", () => {
  it("disables the upstream app updater for macOS", async () => {
    vi.useFakeTimers();
    const adapter = createDisabledUpdateAdapter();
    const check = vi.spyOn(adapter, "checkForUpdates");
    const updater = new UpdateService(adapter, {
      currentVersion: "0.52.1",
      enabled: forkAllowsApplicationUpdates("darwin"),
      autoDownload: true,
      beforeInstall: async () => {},
      platform: "darwin",
      initialCheckDelayMs: 1,
    });
    updater.start();
    await vi.advanceTimersByTimeAsync(20);
    const status = await Effect.runPromise(updater.checkForUpdates());
    expect(status.phase).toBe("unsupported");
    expect(check).not.toHaveBeenCalled();
    await Effect.runPromise(updater.stop());
    vi.useRealTimers();
  });
  it("does not change update policy on other systems", () => {
    expect(forkAllowsApplicationUpdates("linux")).toBe(true);
  });
});
