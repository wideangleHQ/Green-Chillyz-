import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

type VitestPlugins = NonNullable<Parameters<typeof defineConfig>[0]> extends {
  plugins?: infer P;
}
  ? P
  : never;

export default defineConfig({
  // @vitejs/plugin-react resolves its own Vite types, which skew from the
  // copy vitest/config exposes; the shapes are compatible at runtime.
  plugins: [react()] as VitestPlugins,
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
