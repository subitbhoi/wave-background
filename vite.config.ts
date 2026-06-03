import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "preview" ? "./" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  build:
    mode === "preview"
      ? {
          emptyOutDir: true,
          outDir: "dist-preview",
        }
      : {
          emptyOutDir: true,
          lib: {
            entry: "src/index.ts",
            fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
            formats: ["es", "cjs"],
            name: "WaveBackground",
          },
          rollupOptions: {
            external: ["react", "react/jsx-runtime"],
          },
          sourcemap: true,
        },
}));
