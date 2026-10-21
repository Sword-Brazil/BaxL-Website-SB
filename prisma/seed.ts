// Seed idempotente: CTPs, dias de BAX/BAL, Settings e o Administrador padrão (as demais contas,
// de jogadores e da curadoria, são criadas por ele em Admin → Usuários).
// Uso: npx prisma db seed  (lê .env.local)
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BATTLE_DAY_NUMBERS, CTP_QUALITIES, CTP_TYPES, DAY_MODES, type Role } from "../src/models/domain/enums";

// .env.local com expansão de ${VAR} (ex.: a senha do banco dentro das URLs), como no Next.
loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });

const prisma = new PrismaClient();

/** Quinta-feira 12:00 BRT mais recente (início do Dia 1). */
/**
 * Início do Dia 1 de um ciclo real: quinta-feira, 01/10/2026, 12h de Brasília (o Dia 19 começou
 * em 19/10/2026 às 12h). O ciclo se repete a cada 28 dias, então a data vale para qualquer época.
 */
const CYCLE_ANCHOR = new Date("2026-10-01T15:00:00.000Z");

/**
 * Administrador padrão: entra com SEED_ADMIN_USERNAME (ex.: "Sword Menezes", sem diferenciar
 * maiúsculas) e/ou SEED_ADMIN_EMAIL. Se a conta já existe (por um dos dois), atualiza a senha.
 */
async function seedAdmin() {
  const display = process.env.SEED_ADMIN_USERNAME?.trim().replace(/\s+/g, " ") || null;
  const username = display?.toLowerCase() ?? null;
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || null;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if ((!username && !email) || !password) {
    console.warn("⚠ Defina SEED_ADMIN_USERNAME (ou SEED_ADMIN_EMAIL) e SEED_ADMIN_PASSWORD em .env.local; administrador não criado.");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findFirst({
    where: { OR: [...(username ? [{ username }] : []), ...(email ? [{ email }] : [])] },
  });
  const data = { username, email, passwordHash, role: "ADMIN" satisfies Role, nickname: display, emailVerifiedAt: email ? new Date() : null };
  if (existing) await prisma.user.update({ where: { id: existing.id }, data: { ...data, nickname: existing.nickname ?? display } });
  else await prisma.user.create({ data });
  console.log(`✔ Administrador: ${display ?? email}${display && email ? ` (${email})` : ""}`);
}

/** Ícone de cada tipo de CTP, com a extensão do arquivo em public/assets/ctp (manifesto de imagens). */
const CTP_IMAGES: Record<string, string> = JSON.parse(readFileSync(path.join("prisma", "data", "images.json"), "utf8")).ctps;
const ctpImagePath = (type: string) => `/assets/ctp/${type.toLowerCase()}${path.extname(CTP_IMAGES[type] ?? ".png")}`;

async function main() {
  for (const type of CTP_TYPES) {
    for (const quality of CTP_QUALITIES) {
      await prisma.ctp.upsert({
        where: { type_quality: { type, quality } },
        update: {},
        create: { type, quality, imagePath: ctpImagePath(type) },
      });
    }
  }
  console.log(`✔ ${CTP_TYPES.length * CTP_QUALITIES.length} CTPs`);

  for (const mode of DAY_MODES) {
    for (const number of BATTLE_DAY_NUMBERS) {
      await prisma.battleDay.upsert({
        where: { mode_number: { mode, number } },
        update: {},
        create: { mode, number },
      });
    }
  }
  console.log(`✔ ${DAY_MODES.length * BATTLE_DAY_NUMBERS.length} dias de BAX/BAL`);

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, cycleAnchor: CYCLE_ANCHOR },
  });
  console.log("✔ Settings");

  await seedAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
