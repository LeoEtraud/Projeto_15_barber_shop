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
        background_color: "#ffffff",
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
        theme_color: "#2196f3",
      },
    }),
  ],
});
