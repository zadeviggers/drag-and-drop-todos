import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    assetsDir: "resources",
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8080",
    },
  },
  plugins: [react()],
});
