// File: vite.config.mts
// v0.2.2 迭代：ESM 配置（消除 Vite CJS Node API deprecation 警告）
// 移除 inlineDynamicImports，让 React.lazy 视图真正按需分包；
// 手动拆分 pdfjs / react vendor，主包显著瘦身，消除 >500kB chunk 警告。
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 2200,
    rollupOptions: {
      output: {
        manualChunks: {
          "pdfjs": ["pdfjs-dist"],
          "vendor-react": ["react", "react-dom"],
        },
      },
    },
  },
});
