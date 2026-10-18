import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

// Banco de teste fora de src/ e prisma/ para não disparar o watcher do `next dev`.
const DB = "node_modules/.cache/mff-test.db";

// Recria o banco de teste a partir das migrações antes da suíte "server".
export default function setup() {
  mkdirSync("node_modules/.cache", { recursive: true });
  for (const f of [DB, `${DB}-journal`]) rmSync(f, { force: true });
  execSync("npx prisma migrate deploy", {
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: "file:../node_modules/.cache/mff-test.db" },
  });
}
