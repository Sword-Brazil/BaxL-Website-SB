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

// O adaptador traz tipos de uma versão mais nova do Prisma; em tempo de execução é compatível.
const adapter = new PrismaPGlite(pg) as unknown as NonNullable<ConstructorParameters<typeof PrismaClient>[0]>["adapter"];
(globalThis as unknown as { prisma?: PrismaClient }).prisma = new PrismaClient({ adapter });
