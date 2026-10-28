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

- Open a screen from the map. Click **Выбрать элемент** and then click inside the preview.
- Change a property or enter CSS declarations. Select **Этот экран** or **Все экраны**. The generated selector is based on the current DOM; it may not match every story or survive upstream changes. Check the map after each global edit.
- **Принципы интерфейса** changes selected OpenBot color, font, and motion variables plus the root font size in the light theme. Some component styles use other values and may not change.
- Changes are saved in this browser's local storage. They are not written to source files. Use **Экспорт изменений** to download a JSON file for handoff or backup, and **Импорт** to restore it. Clearing browser storage deletes unexported changes. Browser storage is tied to the Storybook URL and port, so export before changing ports.
- CSS in the studio is a proposal, not production code. A developer must apply and check the result in the desktop app.

The studio and its embedded Storybook run locally. The previews use Storybook fixtures and are not the live desktop application. No production settings or data are changed.

The map includes the full application shell with sample data, the actual chat message row component, and the notifications settings view. The main-screen preview uses the real app and a local mock bridge. Its sample content and window controls differ from a live macOS window. Some full conversation and settings stories currently fail in the upstream Storybook fixtures; they are not included until verified.
