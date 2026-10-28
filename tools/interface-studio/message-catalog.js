// Storybook examples use the application's components and fixture data.
const groups = [
  {
    name: "Сообщения",
    items: [
      ["Переписка: разные типы сообщений", "Conversation/Conversation", "all-agent-message-types"],
      ["Облачка сообщений", "Conversation/Chat Primitives", "bubble-gallery"],
      ["Текст, Markdown и вложения", "Conversation/MessageBody", "rich-message"],
      ["Ссылки, упоминания и источники", "Conversation/RichMessageText", "links-and-mentions"],
      ["Действия и события в переписке", "Conversation/Chat Action Marker", "all-states"],
      ["Карточки действий", "Conversation/Chat action card", "note"],
    ],
  },
  {
    name: "Работа агента",
    items: [
      ["Этапы и размышления", "Conversation/AgentSteps", "running"],
      ["Индикатор работы", "Conversation/AgentActivityIndicator", "working"],
      ["Список задач", "Conversation/Task list", "in-progress"],
      ["Другие агенты и подзадачи", "Conversation/Subagents", "running"],
      ["Ожидание ответов", "Conversation/Awaiting replies", "waiting"],
      ["Ожидания и возобновление", "Conversation/Open waits", "waiting"],
      ["Подробности выполнения шагов", "Conversation/TraceWaterfall", "finished"],
    ],
  },
  {
    name: "Рутины и запросы",
    items: [
      ["Расписание рутины", "Routines/Schedule card", "in-conversation"],
      ["Webhook рутины", "Routines/Webhook card", "created"],
      ["Подтверждение действий", "Conversation/ApprovalCard", "command"],
      ["Вопрос пользователю", "Conversation/QuestionPromptBubble", "single-question"],
      ["Выбор ответа", "Conversation/ChoiceCard", "choices"],
      ["Формы, планы и быстрые ответы", "Conversation/UiBlocks", "confirm-pending"],
      ["Вход в сервис MCP", "Conversation/MCP sign-in", "sign-in"],
      ["Предложения подключений и навыков", "Conversation/Marketplace suggestion", "in-conversation"],
      ["Вход и управление браузером", "Conversation/BrowserTakeoverCard", "ready"],
      ["Запрос кода или пароля", "Conversation/BrowserSecretCard", "one-time-code"],
    ],
  },
  {
    name: "Файлы и медиа",
    items: [
      ["Карточки вложений", "Conversation/AttachmentCards", "files"],
      ["Создание изображений", "Conversation/ImageGeneration", "completed"],
      ["Визуализации и интерактивные блоки", "Conversation/ChatVisual", "inline-svg-chart"],
      ["Голосовые сообщения и ответы", "Conversation/VoicePlayer", "spoken-reply"],
    ],
  },
  {
    name: "Состояния и ошибки",
    items: [
      ["Контекст и его сокращение", "Conversation/ContextUsage", "in-conversation"],
      ["Ошибки отправки", "Conversation/Pending send status", "failed"],
      ["Ошибки провайдера", "Conversation/Composer error banner", "provider-error"],
      ["Уведомления о входе и лимитах", "Conversation/Composer notice", "sign-in-required"],
    ],
  },
];

let activeObserver;

export function disposeMessageCatalog() {
  activeObserver?.disconnect();
  activeObserver = undefined;
}

export async function renderMessageCatalog(content) {
  content.innerHTML = `<div class="page catalog"><div class="page-title"><h1>Элементы переписки</h1><p>Примеры компонентов из исходников OpenBot. У каждого элемента можно выбрать состояние; данные в примерах демонстрационные.</p></div><div class="catalog-loading">Загрузка примеров…</div></div>`;
  const container = content.querySelector(".catalog");
  let entries;
  try {
    const response = await fetch("/index.json");
    if (!response.ok) throw new Error("Storybook index unavailable");
    entries = Object.values((await response.json()).entries || {});
  } catch {
    container.querySelector(".catalog-loading").textContent = "Не удалось загрузить каталог Storybook.";
    return;
  }
  if (!container.isConnected) return;
  container.querySelector(".catalog-loading").remove();
  const observer = new IntersectionObserver(
    (changes) => {
      for (const change of changes) {
        const frame = change.target;
        if (change.isIntersecting && frame.dataset.loaded !== "true") {
          frame.dataset.loaded = "true";
          frame.closest(".catalog-card").querySelector("select").disabled = true;
          frame.src = frame.dataset.url;
        } else if (!change.isIntersecting && frame.dataset.loaded === "true") {
          frame.dataset.loaded = "false";
          frame.src = "about:blank";
        }
      }
    },
    { rootMargin: "500px" },
  );
  activeObserver = observer;
  const urlFor = (id) =>
    `/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&catalog=1&globals=colorScheme:light;locale:ru`;
  for (const group of groups) {
    const section = document.createElement("section");
    section.className = "section catalog-section";
    const heading = document.createElement("div");
    heading.className = "section-head";
    const title = document.createElement("h2");
    title.textContent = group.name;
    heading.append(title);
    section.append(heading);
    for (const [label, storyTitle, preferred] of group.items) {
      const stories = entries.filter((entry) => entry.type === "story" && entry.title === storyTitle);
      if (!stories.length) continue;
      const initial = stories.find((story) => story.id.endsWith(`--${preferred}`)) || stories[0];
      const card = document.createElement("article");
      card.className = "catalog-card";
      const head = document.createElement("div");
      head.className = "catalog-card-head";
      const name = document.createElement("h3");
      name.textContent = label;
      const select = document.createElement("select");
      select.setAttribute("aria-label", `Состояние: ${label}`);
      select.disabled = true;
      for (const story of stories) {
        const option = document.createElement("option");
        option.value = story.id;
        option.textContent = story.name;
        option.selected = story.id === initial.id;
        select.append(option);
      }
      head.append(name, select);
      const frame = document.createElement("iframe");
      frame.title = label;
      frame.dataset.url = urlFor(initial.id);
      frame.addEventListener("load", () => {
        const doc = frame.contentDocument;
        if (!doc?.head || frame.src === "about:blank") return;
        doc.documentElement.dataset.visualVariant = "white";
        const stylesheet = doc.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = "/src/renderer/stories/design-main-screen.css?direct";
        doc.head.append(stylesheet);
        const ready = () =>
          doc.querySelector("#storybook-root")?.children.length || doc.querySelector("#error-message")?.textContent;
        if (ready()) {
          select.disabled = false;
          return;
        }
        const rendered = new MutationObserver(() => {
          if (!ready()) return;
          rendered.disconnect();
          clearTimeout(timeout);
          if (frame.contentDocument === doc) select.disabled = false;
        });
        rendered.observe(doc.body, { childList: true, subtree: true, characterData: true });
        const timeout = setTimeout(() => {
          rendered.disconnect();
          if (frame.contentDocument === doc) select.disabled = false;
        }, 20000);
      });
      select.addEventListener("change", () => {
        select.disabled = true;
        frame.dataset.url = urlFor(select.value);
        frame.dataset.loaded = "true";
        frame.src = frame.dataset.url;
      });
      card.append(head, frame);
      section.append(card);
      observer.observe(frame);
    }
    container.append(section);
  }
}
