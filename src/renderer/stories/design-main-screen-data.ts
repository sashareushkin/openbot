import type { ClientAgentSummary, ConversationSnapshot } from "@openbot/contracts/ipc";
import type { MockOpenBotOptions } from "../src/preview/mock-openbot";
import { requireFixture, STORY_AGENT_SUMMARIES, STORY_APP_INFO, STORY_SERVERS } from "./fixtures";

// Example content only. Edit names and messages here; no personal data is loaded.
const first = requireFixture(STORY_AGENT_SUMMARIES[0], "Main screen agent");
const second = requireFixture(STORY_AGENT_SUMMARIES[1], "Second screen agent");
const third = requireFixture(STORY_AGENT_SUMMARIES[2], "Third screen agent");
export const MAIN_SCREEN_AGENTS: ClientAgentSummary[] = [
  { ...first, name: "Альфред", title: "", avatarHue: 215, preview: "Подготовил сводку на сегодня." },
  { ...second, name: "Марк", title: "Помощник", avatarHue: 30, preview: "Продолжаю работу над задачей." },
  { ...third, name: "Кира", title: "Дизайнер", avatarHue: 30, preview: "Собрала варианты интерфейса." },
  {
    ...third,
    id: "lina",
    threadId: "thread-lina",
    name: "Лина",
    title: "Помощница",
    avatarHue: 280,
    preview: "Проверила последние обновления.",
  },
];

const conversation: ConversationSnapshot = {
  agentId: first.id,
  threadId: first.threadId,
  activeTurnId: null,
  revision: 1,
  messages: [
    {
      id: "summary",
      author: "assistant",
      source: "assistant",
      status: "completed",
      createdAt: "2026-10-28T06:10:00.000Z",
      text: "**Доброе утро!** Подготовил пример сводки на сегодня.\n\n**Дела на сегодня**\n\n- Просмотреть новые сообщения и заметки.\n- Обсудить варианты оформления главного экрана.\n- Проверить планы на ближайшие дни.\n\n**Календарь**\n\n- 15:00 — встреча по проекту.\n- 19:00 — свободное время.\n\n**Всё готово:** задачи на сегодня собраны в одном месте.",
    },
    {
      id: "question",
      author: "user",
      source: "user",
      status: "completed",
      createdAt: "2026-10-28T08:01:00.000Z",
      text: "Спасибо, всё понятно.",
    },
    {
      id: "reply",
      author: "assistant",
      source: "assistant",
      status: "completed",
      createdAt: "2026-10-28T08:02:00.000Z",
      text: "Хорошо, буду держать тебя в курсе.",
    },
  ],
};

export const MAIN_SCREEN_OPTIONS: MockOpenBotOptions = {
  agents: MAIN_SCREEN_AGENTS,
  snapshots: Object.fromEntries(
    MAIN_SCREEN_AGENTS.map((agent) => [agent.id, { ...conversation, agentId: agent.id, threadId: agent.threadId }]),
  ),
  tasks: {},
  queues: {},
  storyForeignAgent: false,
  appInfo: { ...STORY_APP_INFO, version: "0.52.1" },
  servers: [{ ...requireFixture(STORY_SERVERS[0], "Local server"), name: "OpenBot" }],
  updateStatus: {
    phase: "up-to-date",
    currentVersion: "0.52.1",
    availableVersion: null,
    progress: null,
    checkedAt: null,
    message: null,
    errorCode: null,
  },
};
