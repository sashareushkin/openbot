const screens = [
  {
    id: "design-main-screen--main",
    group: "Чат",
    name: "Главный экран",
    detail: "Настоящий интерфейс с примером данных",
  },
  {
    id: "conversation-messagemenu--agent-chat",
    group: "Чат",
    name: "Сообщения чата",
    detail: "Компоненты сообщений приложения",
  },
  {
    id: "settings-settingsmodal--notifications",
    group: "Настройки",
    name: "Уведомления",
    detail: "Настройки уведомлений",
  },
];
const content = document.querySelector("#content");
let currentScreen;
// Previously saved local edits remain in place and are never deleted or modified by the viewer.
let saved = { tokens: {}, rules: [] };
try {
  const existing = JSON.parse(localStorage.getItem("openbot-studio-v1"));
  if (existing?.version === 1 && existing.tokens && Array.isArray(existing.rules)) saved = existing;
} catch {
  /* Keep invalid data untouched. */
}
const hasSavedChanges = Object.keys(saved.tokens).length || saved.rules.length || saved.rootFontSize;
if (hasSavedChanges)
  document.querySelector("#legacy-notice").textContent = "Применены ранее сохранённые изменения браузера";
const frameURL = (screen) =>
  `/iframe.html?id=${encodeURIComponent(screen.id)}&viewMode=story&globals=colorScheme:light;locale:ru`;
function applySaved(frame, screen) {
  const doc = frame.contentDocument;
  if (!doc?.head || !hasSavedChanges) return;
  const style = doc.createElement("style");
  const variables = Object.entries(saved.tokens)
    .map(([key, value]) => `${key}:${value} !important;`)
    .join("");
  style.textContent =
    `:root {${variables}}\n${saved.rootFontSize ? `html {font-size:${Number(saved.rootFontSize)}px !important;}` : ""}\n` +
    saved.rules
      .filter((rule) => rule.scope === "all" || rule.screen === screen.id)
      .map((rule) => `${rule.selector} {${rule.css}}`)
      .join("\n");
  doc.head.append(style);
}
function wireFrames() {
  const frames = [...document.querySelectorAll("iframe[data-screen]")];
  const loadNext = (index) => {
    const frame = frames[index];
    if (!frame?.isConnected) return;
    frame.addEventListener(
      "load",
      () => {
        applySaved(
          frame,
          screens.find((screen) => screen.id === frame.dataset.screen),
        );
        const doc = frame.contentDocument;
        const root = doc?.getElementById("storybook-root");
        if (!root || root.children.length) return loadNext(index + 1);
        const observer = new MutationObserver(() => {
          if (root.children.length || doc.querySelector("#error-message")?.textContent) {
            observer.disconnect();
            clearTimeout(timeout);
            loadNext(index + 1);
          }
        });
        observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
        const timeout = setTimeout(() => {
          observer.disconnect();
          loadNext(index + 1);
        }, 30000);
      },
      { once: true },
    );
    frame.src = frame.dataset.url;
  };
  loadNext(0);
}
function renderMap() {
  content.innerHTML = `<div class="page"><div class="page-title"><h1>Карта экранов</h1><p>Выберите экран для просмотра и взаимодействия с прототипом.</p></div>${[
    "Чат",
    "Настройки",
  ]
    .map(
      (group) =>
        `<section class="section"><div class="section-head"><h2>${group}</h2><span>${screens.filter((s) => s.group === group).length} на карте</span></div><div class="grid">${screens
          .filter((s) => s.group === group)
          .map(
            (s) =>
              `<article><div class="card-head"><div><strong>${s.name}</strong><div class="muted">${s.detail}</div></div></div><div class="preview"><iframe title="${s.name}" data-screen="${s.id}" data-url="${frameURL(s)}"></iframe><button type="button" class="overlay" data-open="${s.id}" aria-label="Открыть ${s.name}"></button></div></article>`,
          )
          .join("")}</div></section>`,
    )
    .join("")}</div>`;
  content.querySelectorAll("[data-open]").forEach(
    (button) =>
      void button.addEventListener("click", () => {
        currentScreen = screens.find((screen) => screen.id === button.dataset.open);
        navigate("screen");
      }),
  );
  wireFrames();
}
function renderScreen() {
  content.innerHTML = `<div class="viewer"><div class="editor-main"><div class="editor-title"><div><button class="back" id="back">← Карта экранов</button><h1>${currentScreen.name}</h1><p>${currentScreen.group} / ${currentScreen.detail}</p></div></div><div class="frame-wrap"><iframe title="${currentScreen.name}" data-screen="${currentScreen.id}" data-url="${frameURL(currentScreen)}"></iframe></div></div></div>`;
  content.querySelector("#back").onclick = () => navigate("map");
  wireFrames();
}
async function renderPrinciples() {
  content.innerHTML = `<div class="page"><div class="page-title"><h1>Принципы интерфейса</h1><p>Согласованные решения для пользовательской версии OpenBot.</p></div><div class="panel"><pre id="principles-text" class="principles-text">Загрузка…</pre></div></div>`;
  const target = content.querySelector("#principles-text");
  try {
    const response = await fetch("./DESIGN-PRINCIPLES.md");
    if (!response.ok) throw new Error();
    target.textContent = await response.text();
  } catch {
    target.textContent = "Не удалось загрузить принципы интерфейса.";
  }
}
function navigate(page) {
  document
    .querySelectorAll(".nav")
    .forEach((nav) => void nav.classList.toggle("active", nav.dataset.page === (page === "screen" ? "map" : page)));
  document.querySelector("#breadcrumbs").textContent =
    page === "map"
      ? "Студия / Карта экранов"
      : page === "principles"
        ? "Студия / Принципы интерфейса"
        : `Студия / ${currentScreen.group} / ${currentScreen.name}`;
  if (page === "map") renderMap();
  else if (page === "principles") void renderPrinciples();
  else renderScreen();
}
document.querySelectorAll(".nav").forEach((nav) => {
  nav.onclick = () => navigate(nav.dataset.page);
});
navigate("map");
