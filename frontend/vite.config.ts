import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const version = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version;
  let commit = env.VERCEL_GIT_COMMIT_SHA;
  if (!commit) { try { commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { commit = "local"; } }
  return {
    define: { __CRYPTOID_RELEASE__: JSON.stringify(`${version} · ${commit.slice(0, 8)}`) },
    plugins: [
      react(),
      {
        name: "html-env-replace",
        transformIndexHtml(html) {
          return html.replace(/\$\$BACKEND_URL\$\$/g, () => env.VITE_BACKEND_URL || "$$BACKEND_URL$$");
        },
      },
    ],
    resolve: {
      alias: {
        "@mui/styled-engine": path.resolve(__dirname, "node_modules/@mui/styled-engine-sc"),
      },
    },
    server: {
      port: parseInt(env.PORT) || 3314,
    },
  };
});
