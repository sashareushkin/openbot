import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { createMockOpenBot } from "../src/preview/mock-openbot";
import { OpenBotPlayground } from "../src/preview/OpenBotPlayground";
import "./design-main-screen.css";
import "./design-main-screen-behavior";
import { MAIN_SCREEN_OPTIONS } from "./design-main-screen-data";

const meta = {
  title: "Design/Main screen",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

// Keep a fallback bridge available when Storybook remounts the playground.
const fallback = createMockOpenBot(MAIN_SCREEN_OPTIONS);

export const Main: Story = {
  render: () => {
    window.openbot = fallback.api;
    return <OpenBotPlayground options={MAIN_SCREEN_OPTIONS} />;
  },
};
