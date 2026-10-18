// Seed idempotente: CTPs, dias de BAX/BAL, Settings e as contas ADMIN e USER do dono do projeto.
// Uso: npx prisma db seed  (lê .env.local)
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BATTLE_DAY_NUMBERS, CTP_QUALITIES, CTP_TYPES, DAY_MODES, type Role } from "../src/models/domain/enums";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const prisma = new PrismaClient();

/** Quinta-feira 12:00 BRT mais recente (início do Dia 1). */
function lastThursdayNoonBrt(now = new Date()): Date {
  const brtNow = new Date(now.getTime() - 3 * 3_600_000); // BRT = UTC-3 (sem horário de verão)
  const daysSinceThu = (brtNow.getUTCDay() - 4 + 7) % 7;
  const d = new Date(Date.UTC(brtNow.getUTCFullYear(), brtNow.getUTCMonth(), brtNow.getUTCDate() - daysSinceThu, 15));
  return d.getTime() > now.getTime() ? new Date(d.getTime() - 7 * 86_400_000) : d;
}

async function seedUser(email: string | undefined, password: string | undefined, role: Role) {
  if (!email || !password) {
    console.warn(`⚠ SEED_${role}_EMAIL/SEED_${role}_PASSWORD ausentes em .env.local; conta ${role} não criada.`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const normalized = email.trim().toLowerCase();
  await prisma.user.upsert({
    where: { email: normalized },
    update: { passwordHash, role },
    create: { email: normalized, passwordHash, role, emailVerifiedAt: new Date() },
  });
  console.log(`✔ Conta ${role}: ${normalized}`);
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
    create: { id: 1, cycleAnchor: lastThursdayNoonBrt() },
  });
  console.log("✔ Settings");

  await seedUser(process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD, "ADMIN");
  await seedUser(process.env.SEED_USER_EMAIL, process.env.SEED_USER_PASSWORD, "USER");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
