import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "fullLogo.png", "apple-touch-icon.png"],
      manifest: {
        name: "Framelove",
        short_name: "Framelove",
        description: "Repositório de fotos com amor!",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0f172a",
        icons: [
          {
            src: "/fullLogo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/fullLogo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    allowedHosts: [
      "gg_site.randomrestaurante.pt",
      "site.goncalocgomes.pt",
      "goncaloggomes.me",
    ],
  },
});
