import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],

  manifest: {
    name: "Project Neo",
    short_name: "Neo",
    description:
      "AI-powered catalogue automation for Indian marketplace sellers.",

    permissions: ["sidePanel", "storage"],

    host_permissions: ["*://*.meesho.com/*"],

    web_accessible_resources: [
      {
        resources: ["meesho-main-world.js"],
        matches: ["*://*.meesho.com/*"],
      },
    ],

    side_panel: {
      default_path: "sidepanel/index.html",
    },

    action: {},
  },
});