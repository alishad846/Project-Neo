import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: "Project Neo",
    short_name: "Neo",
    description: "AI-powered catalogue automation for Indian marketplace sellers.",
    permissions: ["sidePanel", "storage"],
    host_permissions: ["http://localhost:3000/*"],
    side_panel: { default_path: "sidepanel/index.html" },
    action: {},
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;",
    },
  },
});
