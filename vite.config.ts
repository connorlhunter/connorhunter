import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  lint: {
    categories: {
      correctness: "off",
    },
    ignorePatterns: [
      "node_modules/**",
      "dist/**",
      ".amplify-hosting/**",
      ".output/**",
      ".vinxi/**",
      ".nitro/**",
      ".tanstack/tmp/**",
      "coverage/**",
      "**/routeTree.gen.ts",
    ],
    rules: {
      complexity: "off",
    },
    overrides: [
      {
        files: ["src/**/*.{js,jsx,ts,tsx}"],
        rules: {
          complexity: ["error", { max: 15, variant: "classic" }],
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    endOfLine: "lf",
    printWidth: 100,
    proseWrap: "preserve",
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "all",
    sortPackageJson: false,
    ignorePatterns: [
      "node_modules",
      "dist",
      ".output",
      "coverage",
      "routeTree.gen.ts",
      "bun.lock",
      "public/pdf.worker.mjs",
    ],
  },
  plugins:
    lazyPlugins(() => [
      tanstackStart(),
      nitro({
        preset: "aws_amplify",
        awsAmplify: {
          runtime: "nodejs22.x",
        },
      }),
      tailwindcss(),
      react(),
    ]) ?? [],
  resolve: {
    tsconfigPaths: true,
  },
});
