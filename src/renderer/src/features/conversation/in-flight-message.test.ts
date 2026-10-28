import type { AgentMessage } from "@openbot/ui/data";
import { describe, expect, it } from "vitest";
import { isInternalInFlightMessage } from "./in-flight-message";

const answer: AgentMessage = {
  id: "a",
  author: "agent",
  kind: "text",
  body: "Checking the files",
  time: "10:00",
  turnId: "turn-1",
};

describe("in-flight agent messages", () => {
  it("hides streaming and completed intermediate messages while the turn is active", () => {
    expect(isInternalInFlightMessage({ ...answer, streaming: true }, "turn-1")).toBe(true);
    expect(isInternalInFlightMessage({ ...answer, streaming: false }, "turn-1")).toBe(true);
    expect(isInternalInFlightMessage({ ...answer, turnId: undefined, streaming: true }, null)).toBe(true);
    expect(isInternalInFlightMessage({ ...answer, turnId: undefined, streaming: false }, "turn-1", true)).toBe(true);
  });
  it("shows the final answer when its turn ends and keeps other rows visible", () => {
    expect(isInternalInFlightMessage({ ...answer, streaming: false }, null)).toBe(false);
    expect(isInternalInFlightMessage({ ...answer, turnId: "older", streaming: false }, "turn-1")).toBe(false);
    expect(isInternalInFlightMessage({ ...answer, author: "you", streaming: true }, "turn-1")).toBe(false);
    expect(isInternalInFlightMessage({ ...answer, kind: "question", streaming: true }, "turn-1")).toBe(false);
  });
});
