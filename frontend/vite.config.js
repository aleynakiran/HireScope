import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Dev: browser calls `/api/*` → proxied to FastAPI (avoids wrong host / 404 from Vite).
 * Override proxy target: `VITE_PROXY_TARGET=http://127.0.0.1:8001 npm run dev`
 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
