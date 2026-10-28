import { describe, expect, it } from "vitest";
import { activityDetailKey } from "./activity-detail";

describe("activity detail", () => {
  it.each([
    ["Reading files…", "chat.activity.readingFiles"],
    ["Editing files…", "chat.activity.editingFiles"],
    ["Browsing a website…", "chat.activity.browsing"],
    ["Searching the web…", "chat.activity.searchingWeb"],
    ["Searching files…", "chat.activity.searchingFiles"],
    ["Checking the work…", "chat.activity.checkingWork"],
    ["Running a command…", "chat.activity.runningCommand"],
    ["Coordinating with agents…", "chat.activity.coordinating"],
  ])("maps %s to a short label", (input, key) => {
    expect(activityDetailKey(input)).toBe(key);
  });
  it("never displays an unknown provider's free-form text", () => {
    expect(activityDetailKey("internal secret value and implementation details")).toBe("chat.activity.thinkingAnswer");
    expect(activityDetailKey(null)).toBe("chat.activity.thinkingAnswer");
  });
});
