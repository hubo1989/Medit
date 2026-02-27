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
      // 引用主项目 src 目录
      "@shared": path.resolve(__dirname, "../src"),
    },
  },
  optimizeDeps: {
    // 排除主项目代码，避免预构建问题
    exclude: [],
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
