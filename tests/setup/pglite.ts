import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PrismaClient } from "@prisma/client";
import { PrismaPGlite } from "pglite-prisma-adapter";

// Postgres em memória (PGlite) para a suíte "server": mesmo banco da produção (Supabase), sem
// Docker nem servidor. As migrações são aplicadas na ordem e o client fica no lugar do de
// `@/server/db` (que reaproveita o client global).
const MIGRATIONS = path.join(process.cwd(), "prisma", "migrations");

const pg = new PGlite();
for (const dir of readdirSync(MIGRATIONS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  await pg.exec(readFileSync(path.join(MIGRATIONS, dir, "migration.sql"), "utf8"));
}

(globalThis as unknown as { prisma?: PrismaClient }).prisma = new PrismaClient({ adapter: new PrismaPGlite(pg) });
