import { avatarHeadColor } from "@openbot/ui/bloub-avatar";
import { MAIN_SCREEN_AGENTS } from "./design-main-screen-data";

// These adapters are limited to the standalone design story. Production components stay unchanged.
if (new URLSearchParams(window.location.search).get("id") === "design-main-screen--main") {
  const originalAnimate = Element.prototype.animate;
  Element.prototype.animate = function (keyframes, options) {
    if (this.closest(".provider-model-trigger")) {
      return originalAnimate.call(
        this,
        keyframes,
        typeof options === "number" ? 0 : { ...options, duration: 0, delay: 0 },
      );
    }
    return originalAnimate.call(this, keyframes, options);
  };

  const measure = document.createElement("div");
  Object.assign(measure.style, {
    position: "fixed",
    visibility: "hidden",
    pointerEvents: "none",
    top: "0",
    left: "0",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    boxSizing: "border-box",
  });
  document.body.append(measure);
  let observed: Element | null = null;
  let observedToolbar: Element | null = null;
  let observedLayer: Element | null = null;
  let selectionRange: Range | null = null;
  let frame = 0;
  const resize = new ResizeObserver(schedule);
  const toolbarResize = new ResizeObserver(schedule);
  const layerObserver = new MutationObserver(schedule);
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  }
  function sync() {
    const layer = document.querySelector<HTMLElement>(".selection-actions-layer");
    if (observedLayer !== layer) {
      layerObserver.disconnect();
      observedLayer = layer;
      if (layer) layerObserver.observe(layer, { attributes: true, attributeFilter: ["data-ready", "style"] });
    }
    const bar = layer?.querySelector<HTMLElement>(".selection-actions-bar");
    if (layer && bar && selectionRange?.startContainer.isConnected) {
      if (observedToolbar !== bar) {
        toolbarResize.disconnect();
        toolbarResize.observe(bar);
        observedToolbar = bar;
      }
      const first = Array.from(selectionRange.getClientRects()).find((rect) => rect.width > 0);
      if (first) {
        const height = bar.getBoundingClientRect().height;
        const above = first.top - height - 8;
        const baseTop = parseFloat(layer.style.top) || 0;
        const target = above >= 12 ? above : baseTop;
        const shift = `${target - baseTop}px`;
        if (layer.style.getPropertyValue("--design-selection-shift") !== shift) {
          layer.style.setProperty("--design-selection-shift", shift);
        }
      }
    } else if (!layer && observedToolbar) {
      toolbarResize.disconnect();
      observedToolbar = null;
    }
    const selected =
      document.querySelector<HTMLElement>(".sidebar-agent-item:has(.agent-row[aria-pressed='true'])")?.dataset.chatId ??
      document
        .querySelector<HTMLElement>(".sidebar-pinned-item:has(.agent-row[aria-pressed='true'])")
        ?.dataset.pinnedKey?.replace(/^agent:/, "");
    const agent = MAIN_SCREEN_AGENTS.find((item) => item.id === selected);
    if (agent) {
      const color = avatarHeadColor(agent.avatarSeed, agent.avatarHue);
      if (document.documentElement.style.getPropertyValue("--design-agent-color") !== color) {
        document.documentElement.style.setProperty("--design-agent-color", color);
      }
    }
    const composer = document.querySelector<HTMLElement>(".composer");
    const editor = composer?.querySelector<HTMLElement>(".composer-editor-surface");
    if (!composer || !editor) return;
    if (observed !== composer) {
      resize.disconnect();
      resize.observe(composer);
      observed = composer;
    }
    const style = getComputedStyle(editor);
    const composerStyle = getComputedStyle(composer);
    const actions = composer.querySelector<HTMLElement>(".composer-primary-actions");
    const button = composer.querySelector<HTMLElement>(".composer-toolbar > .composer-button");
    const width =
      composer.clientWidth -
      parseFloat(composerStyle.paddingLeft) -
      parseFloat(composerStyle.paddingRight) -
      (button?.offsetWidth ?? 28) -
      (actions?.offsetWidth ?? 28) -
      16;
    measure.style.width = `${Math.max(1, width)}px`;
    measure.style.font = style.font;
    measure.style.lineHeight = style.lineHeight;
    const text = editor.innerText || "";
    if (measure.textContent !== text) measure.textContent = text;
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const wrapped = !text.includes("\n") && measure.scrollHeight > lineHeight + 1;
    composer.toggleAttribute("data-design-wrapped", wrapped);
  }
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["aria-pressed"],
  });
  document.addEventListener("input", schedule);
  function onSelection() {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount) {
      const range = selection.getRangeAt(0);
      const element = range.startContainer.parentElement;
      if (element?.closest("[data-selection-message-id]")) selectionRange = range.cloneRange();
    }
    schedule();
  }
  document.addEventListener("selectionchange", onSelection);
  window.addEventListener("scroll", schedule, true);
  window.addEventListener("resize", schedule);
  function cleanup() {
    observer.disconnect();
    resize.disconnect();
    toolbarResize.disconnect();
    layerObserver.disconnect();
    cancelAnimationFrame(frame);
    document.removeEventListener("input", schedule);
    document.removeEventListener("selectionchange", onSelection);
    window.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("beforeunload", cleanup);
    Element.prototype.animate = originalAnimate;
    measure.remove();
  }
  window.addEventListener("beforeunload", cleanup, { once: true });
  import.meta.hot?.dispose(cleanup);
  schedule();
}
