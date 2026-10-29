# OpenBot Studio

A local visual workspace for the desktop interface. It displays OpenBot's existing Storybook stories with sample data. It does not connect to the user's app database or server.

## Start

Use Node.js 24 or later and the Bun version in `package.json`. From the repository root:

```sh
bun install --frozen-lockfile
./tools/interface-studio/start.sh
```

The start script uses the local toolchain when available. Use the Storybook URL printed in the terminal and add `/studio/index.html`, for example `http://localhost:6006/studio/index.html`. The port can differ if another development stack uses it.

## Design principles

The agreed rules are recorded in `tools/interface-studio/DESIGN-PRINCIPLES.md`. Preserve and review them when updating from upstream.

## Edit the main screen in code

Open `src/renderer/stories/design-main-screen.css` and add CSS rules there. Storybook reloads the rules as you save. This file only applies to the main-screen story; it does not change the application. Inspect the preview in browser developer tools to find selectors. The demo uses sample data rather than the screenshot’s real conversations. Edit `src/renderer/stories/design-main-screen-data.ts` to change the names and messages. The preview is based on OpenBot v0.52.1.

## Use

Open a screen from the map to view and interact with the prototype. On the main screen, use the appearance buttons to compare three light variants and the previous version without reloading the app or losing the current draft. The selection lasts until the studio page is reloaded. The studio is read-only: visual changes are made in the prototype code. The principles page shows the saved design document. Previously saved browser overrides remain untouched and are applied to previews, with a notice when present.

The bundled Alegreya Sans fonts are distributed under the SIL Open Font License; see `fonts/OFL.txt`.

The studio and its embedded Storybook run locally. The previews use sample data and are not the live desktop application. The main-screen preview uses the real app and a local mock bridge. Its sample content and window controls differ from a live macOS window.

The main screen has a font comparison for the system font, Ysabeau Office, Nunito, Rubik, Manrope and Comfortaa. The bundled options use local variable font files in `fonts/compare/`; each family includes its SIL Open Font License. These choices are preview-only and do not change the packaged application. The sample messages in `src/renderer/stories/design-main-screen-data.ts` are fictional.
