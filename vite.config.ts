import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro({
      preset: "aws_amplify",
      awsAmplify: {
        runtime: "nodejs22.x",
      },
    }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
