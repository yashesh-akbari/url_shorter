import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/shorten": "http://localhost:3000",
      "/links": "http://localhost:3000",
      "/stats": "http://localhost:3000"
    }
  }
});
