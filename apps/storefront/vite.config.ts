import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// BUILD_WORKSPACE_DIRECTORY is set by `bazel run`; points to the repo root.
// Without it, Vite writes its dep-bundling cache into the Bazel execroot's
// node_modules which is read-only, causing 503s on first load.
const workspaceDir =
  process.env.BUILD_WORKSPACE_DIRECTORY ?? path.resolve(__dirname, "../..");

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  cacheDir: path.join(workspaceDir, ".vite-cache/storefront"),
});
