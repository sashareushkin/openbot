import { describe, expect, it } from "vitest";
import { forkProfilePath, forkWorkspacePath, isMacFork } from "./fork-profile";

describe("macOS fork profiles", () => {
  it("isolates the packaged macOS app and its workspaces", () => {
    expect(isMacFork(true, "darwin")).toBe(true);
    expect(forkProfilePath("/Users/user/Library/Application Support")).toBe(
      "/Users/user/Library/Application Support/OpenBot Fork",
    );
    expect(forkWorkspacePath("/Users/user", "/profile", false)).toBe("/Users/user/OpenBot Fork");
  });
  it("keeps explicit test profiles and their workspaces isolated", () => {
    expect(forkWorkspacePath("/Users/user", "/tmp/test-profile", true)).toBe("/tmp/test-profile/workspace");
    expect(isMacFork(false, "darwin")).toBe(false);
    expect(isMacFork(true, "linux")).toBe(false);
  });
});
