// Configuração da CLI do Prisma 7: as URLs do banco saíram do schema.prisma e vêm daqui.
// Lê .env.local do jeito do Next (com expansão de ${VAR}), como o app e os scripts.
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrações pela conexão de sessão (DIRECT_URL); o app usa o pooler (DATABASE_URL) em src/server/db.ts.
  // process.env e não env(): `prisma generate` (postinstall) roda sem banco e env() falharia.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
});
