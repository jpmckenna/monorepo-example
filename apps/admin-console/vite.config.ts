import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const workspaceDir =
  process.env.BUILD_WORKSPACE_DIRECTORY ?? path.resolve(__dirname, "../..");

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  cacheDir: path.join(workspaceDir, ".vite-cache/admin-console"),
});
