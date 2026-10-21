import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };
const testEnv = {
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
          // Cada arquivo de teste ganha um Postgres em memória (PGlite) já migrado.
          setupFiles: ["tests/setup/pglite.ts", "tests/setup/db.ts"],
          // bcrypt (custo 12) + Postgres em memória: logins em paralelo levam alguns segundos.
          testTimeout: 20_000,
        },
      },
    ],
  },
});
