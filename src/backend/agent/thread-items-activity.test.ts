import { describe, expect, it } from "vitest";
import { toolProgressText } from "./thread-items";

describe("tool activity", () => {
  it.each([
    ["Read", "Reading files…"],
    ["Edit", "Editing files…"],
    ["web_search", "Searching the web…"],
    ["browser_navigate", "Browsing a website…"],
    ["Grep", "Searching files…"],
    ["commandExecution", "Running a command…"],
  ])("gives %s a short status", (name, expected) => {
    expect(toolProgressText({ type: "toolCall", name }, false)).toBe(expected);
  });
  it("uses a general status for unknown tools", () => {
    expect(toolProgressText({ type: "toolCall", name: "custom_mcp_tool" }, false)).toBe("Working on it…");
  });
});
