import { defineConfig } from "vitest/config";
import { defineVitestProject } from "@nuxt/test-utils/config";

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
          env: { DB_NAME: "versa_test" },
        },
      },
      await defineVitestProject({
        // Solution for issue: https://github.com/nuxt/test-utils/issues/1490#issuecomment-4013972739
        // plugins: [
        //   {
        //     name: 'ignore-bun-test',
        //     enforce: 'pre',
        //     resolveId(id) {
        //       if (id === 'bun:test') {
        //         return { id: 'bun:test', external: true }
        //       }
        //     }
        //   }
        // ],
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
