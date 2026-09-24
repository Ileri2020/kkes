import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import inject from '@rollup/plugin-inject';

import glob from "glob";

export default defineConfig({
  base: "./",
  root: path.join(__dirname, "src"),
  build: {
    target: "es2022",
    outDir: path.join(__dirname, "build"),
    // rollupOptions: {
    //   input: glob.sync(path.resolve(__dirname, "src", "*.html")),
    // },
    rollupOptions: {
      input: {
        main : path.resolve(__dirname, "src", "index.html"),
  //      Portfolio : path.resolve(__dirname, "src", "portfolio/index.html"),
  //     resume : path.resolve(__dirname, "src", "resume/index.html"),
      },
      // output: {
      //   manualChunks(id) {
      //     if (id.includes(path.resolve(__dirname, "src", "pages/portfolio.tsx"))) {
      //       return 'portfolio';
      //     }
      //     if (id.includes(path.resolve(__dirname, "src", "pages/resume.tsx"))) {
      //       return 'resume';
      //     }
      //   },
      // },
    },
  },
  plugins: [react(),
          inject({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
          }),
  ],
  optimizeDeps: {
    include: ['jquery'],
    esbuildOptions: {
      target: "es2022",
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    target: "es2022"
  },
})
