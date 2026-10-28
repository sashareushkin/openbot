import { TRANSLATED_LOCALES, type TranslatedLocale } from "@openbot/i18n";
import { installPointerFocusGuard } from "@openbot/ui/pointer-focus";
import type { Preview } from "storybook-solidjs-vite";
import { StaticI18nProvider } from "../src/renderer/src/i18n-context";
import { createMockOpenBot } from "../src/renderer/src/preview/mock-openbot";
import "../src/renderer/src/styles.css";
import "./preview.css";

installPointerFocusGuard();

// The catalog uses a fixture bridge when a story remounts its own mock.
if (new URLSearchParams(window.location.search).has("catalog")) {
  window.openbot = createMockOpenBot().api;
}

function isTranslatedLocale(value: unknown): value is TranslatedLocale {
  return TRANSLATED_LOCALES.some((locale) => locale === value);
}

const preview: Preview = {
  // The toolbar switches every story's text, so a translation can be read in its real layout.
  globalTypes: {
    locale: {
      description: "Interface language",
      toolbar: { icon: "globe", items: [...TRANSLATED_LOCALES], dynamicTitle: true },
    },
    // The palette of tokens-light.css or the dark base, as the app's root attribute selects it.
    colorScheme: {
      description: "Color scheme",
      toolbar: { icon: "contrast", items: ["dark", "light"], dynamicTitle: true },
    },
  },
  initialGlobals: { locale: "en", colorScheme: "dark" },
  decorators: [
    (Story, context) => {
      // Solid 2 can expose an empty reactive args store on the first render.
      if (Object.keys(context.args).length === 0) context.args = context.unmappedArgs;
      document.documentElement.dataset.openbotColorScheme = context.globals.colorScheme === "light" ? "light" : "dark";
      return (
        <StaticI18nProvider locale={isTranslatedLocale(context.globals.locale) ? context.globals.locale : "en"}>
          {Story()}
        </StaticI18nProvider>
      );
    },
  ],
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "error",
    },
    controls: {
      expanded: true,
    },
  },
};

export default preview;
