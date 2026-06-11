import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Backend ka proxy - API calls mein /api likhne se automatically backend pe jayega
    proxy: {
      "/api": {
        target: "https://chatapp-815o.onrender.com",
        changeOrigin: true,
      },
    },
  },
});
