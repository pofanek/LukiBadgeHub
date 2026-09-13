import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
function leaderboardOwnerId() {
  if (process.env.ownerId) return process.env.ownerId;

  try {
    const ownerEnvironment = readFileSync(
      path.resolve(__dirname, "..", ".env.owner"),
      "utf8",
    );
    const ownerLine = ownerEnvironment
      .split(/\r?\n/)
      .find((line) => line.trim().startsWith("ownerId="));

    return ownerLine?.split("=", 2)[1]?.trim() || "";
  } catch {
    return "";
  }
}

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    define: {
      "import.meta.env.VITE_LEADERBOARD_OWNER_ID": JSON.stringify(
        leaderboardOwnerId(),
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
