import { defineConfig } from "vite";
import path from "path";

export default defineConfig(async () => ({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    commonjsOptions: {
      // Convert CommonJS modules to ES modules
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      // 引用 markdown-viewer core 包
      "@shared": path.resolve(__dirname, "../markdown-viewer/src"),
    },
  },
  optimizeDeps: {
    // 包含需要预构建的依赖
    include: [
      "unified",
      "remark-parse",
      "remark-gfm",
      "remark-math",
      "remark-cjk-friendly",
      "remark-gemoji",
      "remark-rehype",
      "rehype-katex",
      "rehype-highlight",
      "rehype-stringify",
      "rehype-slug",
      "unist-util-visit",
      "github-slugger",
      "hast-util-heading-rank",
      "hast-util-to-string",
    ],
  },
}));
