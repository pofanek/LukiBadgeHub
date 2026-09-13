import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const ownerEnvironment = loadEnv(mode, path.resolve(__dirname, ".."), "");

  return {
    define: {
      "import.meta.env.VITE_LEADERBOARD_OWNER_ID": JSON.stringify(
        ownerEnvironment.ownerId || "",
      ),
    },
    plugins: [react(), tailwindcss()],
    server: {
      watch: {
        usePolling: true,
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
