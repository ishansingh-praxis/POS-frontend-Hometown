// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,                 // default, you can change to any port
    proxy: {
      // Forward all requests starting with /api to your backend
      "/api": {
        target: "http://localhost:5003",
        changeOrigin: true,
        // If your backend does NOT expect the /api prefix, uncomment the line below:
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});