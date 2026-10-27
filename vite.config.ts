import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 新しいService Workerはすぐに有効にし、ページを再読み込みして反映する。
      // 登録と更新確認は src/register-sw.ts で行う
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["icon_144x144.png", "robots.txt"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,webp,svg,ico}"],
        // SNS共有用の画像はアプリでは使わない
        globIgnores: ["ogp.png"],
        clientsClaim: true,
        skipWaiting: true,
        // 古いバージョンのキャッシュを残さない
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: "たまっぷ",
        short_name: "たまっぷ",
        description: "法政大学多摩キャンパスと最寄り駅を結ぶバスの時刻をすぐに確認できるアプリ",
        lang: "ja",
        start_url: "./",
        scope: "./",
        display: "standalone",
        theme_color: "#38bdf8",
        background_color: "#38bdf8",
        icons: [
          {
            src: "icon_192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon_512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
