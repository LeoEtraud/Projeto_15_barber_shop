import path from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Balata Barbearia",
        short_name: "Balata Barbearia",
        start_url: ".",
        display: "standalone",
        background_color: "#000000",
        description: "Descrição do seu aplicativo",
        icons: [
          {
            src: "barber2.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "barber2.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        theme_color: "#000000",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
