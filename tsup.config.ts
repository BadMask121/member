import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cloud-run.ts", "src/index.ts"],
  format: "esm",
  splitting: false,
  sourcemap: true,
  clean: true,
});
