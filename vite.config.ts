import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/devboard-pro/" : "/",
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to the backend to avoid CORS in development
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tooltip"],
          "vendor-editor": ["@tiptap/react", "@tiptap/starter-kit", "codemirror", "react-codemirror2"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
}));
