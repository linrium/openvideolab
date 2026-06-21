import { cloudflare } from "@cloudflare/vite-plugin"
import rsc from "@vitejs/plugin-rsc"
import vinext from "vinext"
import { defineConfig } from "vite"

export default defineConfig({
  build: {
    rolldownOptions: {
      external: ["cloudflare:workers"],
    },
  },
  plugins: [
    vinext({ rsc: false }),
    rsc({
      entries: {
        client: "virtual:vinext-app-browser-entry",
        rsc: "virtual:vinext-rsc-entry",
        ssr: "virtual:vinext-app-ssr-entry",
      },
    }),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
})
