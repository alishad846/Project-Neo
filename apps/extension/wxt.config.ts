import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: "Project Neo",
    short_name: "Neo",
    description: "AI-powered catalogue automation for Indian marketplace sellers.",
    permissions: ["sidePanel", "storage", "tabs", "activeTab"],
    // The live Meesho Add-Product page is targeted via the `live` selector
    // config (see @neo/adapter-meesho) + the meesho.com host permission below.
    // The localhost/127.0.0.1 entries let the fixture be demoed when served
    // over http for local, account-safe testing.
    host_permissions: [
      "http://localhost:3000/*",
      "*://*.meesho.com/*",
      "http://localhost/*",
      "http://127.0.0.1/*",
    ],
    side_panel: { default_path: "sidepanel/index.html" },
    action: {},
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;",
    },
  },
});
