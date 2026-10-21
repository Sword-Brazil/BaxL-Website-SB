import { afterEach, beforeEach } from "vitest";
import { prisma } from "@/server/db";
import { flushNotifications } from "@/server/services/notificationService";

/** Apaga o conteúdo de todas as tabelas do banco de teste. */
export async function resetDb() {
  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'",
  );
  if (tables.length) await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
}

// Avisos de segurança gravados em segundo plano (falhas de login) terminam antes do próximo
// teste limpar o banco; senão gravam sobre o teste seguinte ou falham por chave estrangeira.
afterEach(async () => {
  await flushNotifications();
});

beforeEach(async () => {
  await resetDb();
});
