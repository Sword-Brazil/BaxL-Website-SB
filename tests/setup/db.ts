import { beforeEach } from "vitest";
import { prisma } from "@/server/db";

/** Apaga o conteúdo de todas as tabelas do banco de teste. */
export async function resetDb() {
  const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'",
  );
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  for (const { name } of tables) await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
}

beforeEach(async () => {
  await resetDb();
});
