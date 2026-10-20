import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const localTestnet = env.VERCEL_ENV === "preview" && env.CRYPTOID_TESTNET_BACKEND === "local";
  const version = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version;
  let commit = env.VERCEL_GIT_COMMIT_SHA;
  if (!commit) { try { commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { commit = "local"; } }
  let sourceTree = '', workingTreeDirty = true;
  try {
    sourceTree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim();
    workingTreeDirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { encoding: 'utf8' }).trim().length > 0;
  } catch { /* Unknown identity is explicit; do not invent a clean release. */ }
  return {
    define: { __CRYPTOID_RELEASE__: JSON.stringify(`${version} · ${commit.slice(0, 8)}`),
      __CRYPTOID_BUILD__: JSON.stringify({ sourceCommit: commit, sourceTree, workingTreeDirty }) },
    // Bundle the native animation acceptance page only in protected previews.
    // Production keeps the ordinary single-page app and no public QA route.
    build: env.VERCEL_ENV === "preview" ? {
      rollupOptions: { input: {
        app: path.resolve(__dirname, "index.html"),
        framePacing: path.resolve(__dirname, "scripts/fixtures/frame-pacing.html"),
      } },
    } : undefined,
    plugins: [
      react(),
      {
        name: "html-env-replace",
        transformIndexHtml(html) {
          return html.replace(/\$\$BACKEND_URL\$\$/g, () => localTestnet ? "/api" : env.VITE_BACKEND_URL || "$$BACKEND_URL$$").replace(/\$\$APP_NETWORK\$\$/g, () => localTestnet ? "testnet" : "");
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
