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
const tokens = [
  ["--openbot-bg-canvas", "Фон приложения", "#f5f5f6"],
  ["--openbot-bg-sidebar", "Фон боковой панели", "#f5f5f6"],
  ["--openbot-bg-surface", "Поверхности", "#ffffff"],
  ["--openbot-bg-sheet", "Панели и окна", "#ffffff"],
  ["--openbot-text-primary", "Основной текст", "#141414"],
  ["--openbot-text-secondary", "Вторичный текст", "#3a3a3c"],
  ["--openbot-text-muted", "Приглушённый текст", "#6b6b70"],
  ["--openbot-accent", "Акцент", "#007cf7"],
];
const storageKey = "openbot-studio-v1";
const blank = () => ({ version: 1, tokens: {}, rules: [] });
let state;
try {
  state = JSON.parse(localStorage.getItem(storageKey)) || blank();
} catch {
  state = blank();
}
if (state.version !== 1 || !state.tokens || !Array.isArray(state.rules)) state = blank();
let currentPage = "map";
let currentScreen = null;
let selected = null;
let selecting = false;
const content = document.querySelector("#content");
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const frameURL = (screen) =>
  `/iframe.html?id=${encodeURIComponent(screen.id)}&viewMode=story&globals=colorScheme:light;locale:ru`;
function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  document.querySelector("#save-status").textContent =
    `Сохранено · ${state.rules.length + Object.keys(state.tokens).length + (state.rootFontSize ? 1 : 0)} изменений`;
  applyAll();
}
function cssFor(screen) {
  const variables = Object.entries(state.tokens)
    .map(([key, value]) => `${key}:${value} !important;`)
    .join("");
  return (
    `:root {${variables}}\n${state.rootFontSize ? `html { font-size: ${Number(state.rootFontSize)}px !important; }` : ""}\n` +
    state.rules
      .filter((rule) => rule.scope === "all" || rule.screen === screen.id)
      .map((rule) => `${rule.selector} { ${rule.css} }`)
      .join("\n")
  );
}
function apply(frame) {
  try {
    const doc = frame.contentDocument;
    if (!doc?.head || !frame.dataset.screen) return;
    let style = doc.getElementById("openbot-studio-overrides");
    if (!style) {
      style = doc.createElement("style");
      style.id = "openbot-studio-overrides";
      doc.head.append(style);
    }
    style.textContent =
      cssFor(screens.find((screen) => screen.id === frame.dataset.screen)) +
      "\n[data-studio-selected] { outline: 2px solid #4b7bec !important; outline-offset: 2px; }";
  } catch {
    /* The frame is not ready yet. */
  }
}
function applyAll() {
  document.querySelectorAll("iframe[data-screen]").forEach(apply);
}
function wireFrames() {
  const frames = [...document.querySelectorAll("iframe[data-screen]")];
  const loadNext = (index) => {
    if (index >= frames.length || !frames[index].isConnected) return;
    const frame = frames[index];
    frame.addEventListener(
      "load",
      () => {
        apply(frame);
        if (currentPage === "editor") {
          attachPicker(frame);
          return;
        }
        const doc = frame.contentDocument;
        const root = doc?.getElementById("storybook-root");
        const ready = () => !root || root.children.length || doc.querySelector("#error-message")?.textContent;
        if (ready()) {
          loadNext(index + 1);
          return;
        }
        const observer = new MutationObserver(() => {
          if (ready()) {
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
    if (frame.dataset.url) frame.src = frame.dataset.url;
  };
  loadNext(0);
}
function renderMap() {
  content.innerHTML = `<div class="page"><div class="page-title"><h1>Карта экранов</h1><p>Состояния приложения рядом друг с другом. Выберите экран, чтобы изменить его.</p></div>${[
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
  content
    .querySelectorAll("[data-open]")
    .forEach((button) => void button.addEventListener("click", () => openScreen(button.dataset.open)));
  wireFrames();
}
function selectorFor(element) {
  const parts = [];
  while (element && element.nodeType === 1 && element.id !== "storybook-root" && parts.length < 6) {
    let part = element.localName;
    if (element.id) {
      parts.unshift(`#${CSS.escape(element.id)}`);
      break;
    }
    const classes = [...element.classList].filter((x) => !x.startsWith("studio-")).slice(0, 3);
    if (classes.length) part += classes.map((x) => `.${CSS.escape(x)}`).join("");
    else if (element.parentElement)
      part += `:nth-of-type(${[...element.parentElement.children].filter((e) => e.localName === element.localName).indexOf(element) + 1})`;
    parts.unshift(part);
    element = element.parentElement;
  }
  return parts.join(" > ");
}
function attachPicker(frame) {
  const doc = frame.contentDocument;
  if (!doc || doc.__studioAttached) return;
  doc.__studioAttached = true;
  doc.addEventListener(
    "click",
    (event) => {
      if (!selecting) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      doc
        .querySelectorAll("[data-studio-selected]")
        .forEach((element) => void element.removeAttribute("data-studio-selected"));
      event.target.setAttribute("data-studio-selected", "");
      selected = { selector: selectorFor(event.target), tag: event.target.localName };
      apply(frame);
      selecting = false;
      renderInspector();
    },
    true,
  );
}
function renderEditor() {
  content.innerHTML = `<div class="editor"><div class="editor-main"><div class="editor-title"><div><button class="back" id="back">← Карта экранов</button><h1>${currentScreen.name}</h1><p>${currentScreen.group} / ${currentScreen.detail}</p></div><button id="select-element" class="primary">Выбрать элемент</button></div><div class="frame-wrap"><iframe title="${currentScreen.name}" data-screen="${currentScreen.id}" data-url="${frameURL(currentScreen)}"></iframe></div></div><aside class="inspector" id="inspector"></aside></div>`;
  content.querySelector("#back").onclick = () => navigate("map");
  content.querySelector("#select-element").onclick = () => {
    selecting = !selecting;
    renderInspector();
  };
  wireFrames();
  renderInspector();
}
function renderInspector() {
  const panel = document.querySelector("#inspector");
  if (!panel) return;
  const button = document.querySelector("#select-element");
  button.textContent = selecting ? "Нажмите на элемент…" : "Выбрать элемент";
  if (!selected) {
    panel.innerHTML = `<h2>Инспектор</h2><p class="muted">Выберите элемент на экране, чтобы настроить его свойства.</p><div class="empty">Нажмите «Выбрать элемент», затем нажмите на нужную часть интерфейса.</div>`;
    return;
  }
  const rule = state.rules.find((r) => r.selector === selected.selector && r.screen === currentScreen.id);
  const declaration = rule?.css || "";
  const frame = content.querySelector("iframe");
  const element = frame?.contentDocument?.querySelector("[data-studio-selected]");
  const computed = element ? frame.contentWindow.getComputedStyle(element) : null;
  const style = document.createElement("div").style;
  style.cssText = declaration;
  panel.innerHTML = `<h2>Инспектор</h2><p class="muted">Выбран элемент ${escapeHtml(selected.tag)}</p><div class="inspect-label">Селектор</div><div class="selector">${escapeHtml(selected.selector)}</div><div class="inspect-label">Область применения</div><div class="field"><label for="scope">Применить</label><select id="scope"><option value="screen">Этот экран</option><option value="all">Все экраны</option></select></div><div class="inspect-label">Свойства CSS</div>${[
    ["background-color", "Фон"],
    ["color", "Цвет текста"],
    ["font-size", "Размер шрифта"],
    ["padding", "Внутренний отступ"],
    ["margin", "Внешний отступ"],
    ["border-radius", "Скругление"],
    ["width", "Ширина"],
  ]
    .map(
      ([key, label]) =>
        `<div class="field"><label for="prop-${key}">${label}</label><input id="prop-${key}" data-property="${key}" value="${escapeHtml(style.getPropertyValue(key))}" placeholder="${escapeHtml(computed?.getPropertyValue(key) || "значение CSS")}"></div>`,
    )
    .join(
      "",
    )}<label class="field stack">Дополнительный CSS<textarea id="css" spellcheck="false" placeholder="border: 1px solid #ddd;">${escapeHtml(declaration)}</textarea></label><button id="save-rule">Применить CSS</button> <button id="remove-rule">Удалить правку</button><p class="muted">Правки записываются в браузере. Экспортируйте их в файл, чтобы передать их для переноса.</p>`;
  panel.querySelector("#scope").value = rule?.scope || "screen";
  function save(css) {
    const existing = state.rules.findIndex((r) => r.selector === selected.selector && r.screen === currentScreen.id);
    const next = {
      screen: currentScreen.id,
      selector: selected.selector,
      scope: panel.querySelector("#scope").value,
      css,
    };
    if (existing < 0) state.rules.push(next);
    else state.rules[existing] = next;
    persist();
  }
  panel.querySelectorAll("[data-property]").forEach(
    (input) =>
      void input.addEventListener("change", () => {
        const d = document.createElement("div").style;
        d.cssText = panel.querySelector("#css").value;
        d.setProperty(input.dataset.property, input.value);
        panel.querySelector("#css").value = d.cssText;
        save(d.cssText);
      }),
  );
  panel.querySelector("#scope").addEventListener("change", () => save(panel.querySelector("#css").value));
  panel.querySelector("#save-rule").onclick = () => {
    save(panel.querySelector("#css").value);
    renderInspector();
  };
  panel.querySelector("#remove-rule").onclick = () => {
    state.rules = state.rules.filter((r) => !(r.selector === selected.selector && r.screen === currentScreen.id));
    persist();
    renderInspector();
  };
}
function renderPrinciples() {
  content.innerHTML = `<div class="page"><div class="page-title"><h1>Принципы интерфейса</h1><p>Общие значения для светлой темы OpenBot.</p></div><div class="principle-grid"><div class="panel"><h2>Цвета</h2><p class="muted">Изменения применяются ко всем представлениям на карте.</p>${tokens.map(([key, label, defaultValue]) => `<div class="token-row"><div class="field"><label for="${key}">${label}</label><input type="color" id="${key}" data-token="${key}" value="${escapeHtml(state.tokens[key] || defaultValue)}"></div><small>${key}</small></div>`).join("")}<h3>Типографика и движение</h3><div class="token-row"><div class="field"><label for="root-font-size">Базовый размер текста</label><input id="root-font-size" type="number" min="8" max="32" value="${escapeHtml(state.rootFontSize || "")}" placeholder="По умолчанию"></div><small>Размер корня, влияет на значения в rem</small></div><div class="token-row"><div class="field"><label for="font-family">Основной шрифт</label><input id="font-family" data-text-token="--openbot-font-sans" value="${escapeHtml(state.tokens["--openbot-font-sans"] || "")}" placeholder="Как в OpenBot"></div><small>--openbot-font-sans</small></div><div class="token-row"><div class="field"><label for="modal-duration">Открытие окна</label><input id="modal-duration" data-text-token="--modal-open-dur" value="${escapeHtml(state.tokens["--modal-open-dur"] || "")}" placeholder="250ms"></div><small>--modal-open-dur</small></div><p class="note">Это общие переменные исходного интерфейса. Пустое значение возвращает настройку OpenBot. Некоторые элементы имеют собственные стили.</p><button id="reset-tokens">Вернуть исходные значения</button></div><div class="panel"><h2>Как это работает</h2><p class="muted">Значения применяются к настоящим компонентам в Storybook. Вернитесь на карту, чтобы сравнить все состояния.</p><h3>Передача изменений</h3><p class="muted">Сохраните файл кнопкой «Экспорт изменений» и укажите его в чате. Его можно импортировать обратно в студию.</p><h3>Тема студии</h3><p class="muted">Светлая</p></div></div></div>`;
  content.querySelectorAll("[data-token]").forEach(
    (input) =>
      void input.addEventListener("input", () => {
        state.tokens[input.dataset.token] = input.value;
        persist();
      }),
  );
  content.querySelector("#root-font-size").addEventListener("change", (event) => {
    const n = Number(event.target.value);
    if (n >= 8 && n <= 32) state.rootFontSize = n;
    else delete state.rootFontSize;
    persist();
  });
  content.querySelectorAll("[data-text-token]").forEach(
    (input) =>
      void input.addEventListener("change", () => {
        if (input.value.trim()) state.tokens[input.dataset.textToken] = input.value.trim();
        else delete state.tokens[input.dataset.textToken];
        persist();
      }),
  );
  content.querySelector("#reset-tokens").onclick = () => {
    state.tokens = {};
    delete state.rootFontSize;
    persist();
    renderPrinciples();
  };
}
function openScreen(id) {
  currentScreen = screens.find((s) => s.id === id);
  selected = null;
  selecting = false;
  navigate("editor");
}
function navigate(page) {
  currentPage = page;
  document
    .querySelectorAll(".nav")
    .forEach((nav) => void nav.classList.toggle("active", nav.dataset.page === (page === "editor" ? "map" : page)));
  document.querySelector("#breadcrumbs").textContent =
    page === "map"
      ? "Студия / Карта экранов"
      : page === "principles"
        ? "Студия / Принципы интерфейса"
        : `Студия / ${currentScreen.group} / ${currentScreen.name}`;
  if (page === "map") renderMap();
  else if (page === "principles") renderPrinciples();
  else renderEditor();
}
document.querySelectorAll(".nav").forEach((nav) => {
  nav.onclick = () => navigate(nav.dataset.page);
});
document.querySelector("#export").onclick = () => {
  const blob = new Blob([`${JSON.stringify(state, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "openbot-studio-changes.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
document.querySelector("#import").onchange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (
      data.version !== 1 ||
      !data.tokens ||
      !Array.isArray(data.rules) ||
      data.rules.some(
        (r) => typeof r.selector !== "string" || typeof r.css !== "string" || !["screen", "all"].includes(r.scope),
      )
    )
      throw new Error("invalid");
    state = data;
    persist();
    navigate(currentPage);
  } catch {
    alert("Не удалось открыть файл изменений OpenBot Studio.");
  }
  event.target.value = "";
};
navigate("map");
