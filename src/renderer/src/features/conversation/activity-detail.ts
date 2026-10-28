import type { AppTextKey } from "@openbot/i18n";

/** Never show free-form provider text in the activity indicator. */
export function activityDetailKey(detail: string | null | undefined): AppTextKey {
  const text = (detail ?? "").toLowerCase();
  if (/brows|website|page|navigate|fetch/.test(text)) return "chat.activity.browsing";
  if (/web|internet|current information|sources/.test(text)) return "chat.activity.searchingWeb";
  if (/search.*files|search.*project|grep|glob/.test(text)) return "chat.activity.searchingFiles";
  if (/edit|writ|chang|patch|file change/.test(text)) return "chat.activity.editingFiles";
  if (/read.*file|gather.*information|reviewing the information/.test(text)) return "chat.activity.readingFiles";
  if (/check|test|verif|lint|build/.test(text)) return "chat.activity.checkingWork";
  if (/command|shell|terminal/.test(text)) return "chat.activity.runningCommand";
  if (/agent|coordinat/.test(text)) return "chat.activity.coordinating";
  if (/memor/.test(text)) return "chat.activity.workingMemory";
  return "chat.activity.thinkingAnswer";
}
