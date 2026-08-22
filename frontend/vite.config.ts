import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, proxy: { "/api": "http://localhost:5000" } },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          tensorflow: ["@tensorflow/tfjs", "@tensorflow-models/coco-ssd"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
