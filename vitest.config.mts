import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };
const testEnv = {
  DATABASE_URL: "file:../node_modules/.cache/mff-test.db",
  SESSION_SECRET: "test-secret-test-secret-test-secret-123",
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "models",
          environment: "node",
          include: ["tests/unit/models/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "server",
          environment: "node",
          include: ["tests/unit/server/**/*.test.ts"],
          env: testEnv,
          globalSetup: ["tests/setup/db.global.ts"],
          setupFiles: ["tests/setup/db.ts"],
          // Todos os arquivos compartilham o mesmo banco de teste.
          fileParallelism: false,
        },
      },
    ],
  },
});
