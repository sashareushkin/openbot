import type { AgentMessage } from "@openbot/ui/data";

/** Providers may label commentary only after it has streamed; wait for the turn to end. */
export function isInternalInFlightMessage(
  message: AgentMessage,
  activeTurnId: string | null | undefined,
  previouslyStreamed = false,
): boolean {
  if (message.author !== "agent" || message.kind !== "text" || message.exchange) return false;
  return message.streaming === true || (!!activeTurnId && (message.turnId === activeTurnId || previouslyStreamed));
}
