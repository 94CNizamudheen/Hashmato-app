
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // 👈 loads root .env
  return {
    plugins: [react()],
    server: {
    port: 5173, 
  },
    define: {
      "import.meta.env": env,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
