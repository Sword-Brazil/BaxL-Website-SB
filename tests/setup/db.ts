import { afterEach, beforeEach } from "vitest";
import { prisma } from "@/server/db";
import { flushNotifications } from "@/server/services/notificationService";

/** Apaga o conteúdo de todas as tabelas do banco de teste. */
export async function resetDb() {
  const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'",
  );
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  for (const { name } of tables) await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
}

// Avisos de segurança gravados em segundo plano (falhas de login) terminam antes do próximo
// teste limpar o banco; senão gravam sobre o teste seguinte ou falham por chave estrangeira.
afterEach(async () => {
  await flushNotifications();
});

beforeEach(async () => {
  await resetDb();
});
