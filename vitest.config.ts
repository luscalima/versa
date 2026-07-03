import { defineConfig } from "vitest/config";
import { defineVitestProject } from "@nuxt/test-utils/config";
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    globalSetup: ["test/globalSetup.ts"],
    projects: [
      {
        test: {
          globals: true,
          name: "unit",
          include: ["test/unit/**/*.{test,spec}.ts"],
          environment: "node",
        },
      },
      {
        test: {
          globals: true,
          name: "e2e",
          include: ["test/e2e/**/*.{test,spec}.ts"],
          environment: "node",
          fileParallelism: false,
          testTimeout: 60000,
        },
        resolve: {
          alias: {
            '#server': fileURLToPath(new URL('./server', import.meta.url)),
            '#test': fileURLToPath(new URL('./test', import.meta.url)),
          },
        },
      },
      await defineVitestProject({
        test: {
          globals: true,
          name: "nuxt",
          include: ["test/nuxt/**/*.{test,spec}.ts"],
          environment: "nuxt",
        },
      }),
    ],
  },
});
