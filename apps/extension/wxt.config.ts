import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: "Project Neo",
    short_name: "Neo",
    description: "AI-powered catalogue automation for Indian marketplace sellers.",
    // `scripting` lets us inject the filler into an already-open Meesho tab if
    // the declarative content script wasn't present yet (extension loaded after
    // the tab), so Autofill "just works" without a manual refresh.
    permissions: ["sidePanel", "storage", "tabs", "activeTab", "scripting"],
    // localhost:3000 = backend API. meesho.com = the live Add-Product page the
    // content script fills.
    host_permissions: ["http://localhost:3000/*", "*://*.meesho.com/*"],
    side_panel: { default_path: "sidepanel/index.html" },
    action: {},
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;",
    },
  },
});
