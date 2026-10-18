// Dados de DEMONSTRAÇÃO para desenvolvimento e validação da US1 (não é conteúdo real da aliança).
// Uso: npm run seed:demo   (rodar depois de `npx prisma db seed`)
import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import type { AttackType, CtpQuality, CtpType, Gender, Side, Slot, Species } from "../src/models/domain/enums";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const prisma = new PrismaClient();

type DemoAgent = [slug: string, name: string, gender: Gender, side: Side, species: Species, attack: AttackType];

const AGENTS: DemoAgent[] = [
  ["captain-america", "Captain America", "MALE", "HERO", "NEO_HUMAN", "COMBAT"],
  ["iron-man", "Iron Man", "MALE", "HERO", "HUMAN", "BLAST"],
  ["thor", "Thor", "MALE", "HERO", "OTHER", "UNIVERSAL"],
  ["black-widow", "Black Widow", "FEMALE", "HERO", "HUMAN", "SPEED"],
  ["scarlet-witch", "Scarlet Witch", "FEMALE", "HERO", "MUTANT", "UNIVERSAL"],
  ["storm", "Storm", "FEMALE", "HERO", "MUTANT", "BLAST"],
  ["captain-marvel", "Captain Marvel", "FEMALE", "HERO", "NEO_HUMAN", "BLAST"],
  ["hela", "Hela", "FEMALE", "VILLAIN", "OTHER", "UNIVERSAL"],
  ["thanos", "Thanos", "MALE", "VILLAIN", "ALIEN", "COMBAT"],
  ["magneto", "Magneto", "MALE", "VILLAIN", "MUTANT", "UNIVERSAL"],
  ["loki", "Loki", "MALE", "VILLAIN", "OTHER", "UNIVERSAL"],
  ["mystique", "Mystique", "FEMALE", "VILLAIN", "MUTANT", "SPEED"],
];

const TEAMS: { mode: "BAX" | "BAL"; number: number; members: [Slot, string, CtpType, CtpQuality][] }[] = [
  {
    mode: "BAX",
    number: 1,
    members: [
      ["SOLO", "scarlet-witch", "RAGE", "BRILLIANT"],
      ["SUPPORT_1", "captain-marvel", "LIBERATION", "MIGHTY"],
      ["SUPPORT_2", "storm", "INSIGHT", "MIGHTY"],
    ],
  },
  {
    mode: "BAX",
    number: 4,
    members: [
      ["SOLO", "hela", "RAGE", "BRILLIANT"],
      ["SUPPORT_1", "magneto", "LIBERATION", "MIGHTY"],
      ["SUPPORT_2", "loki", "JUDGEMENT", "NORMAL"],
    ],
  },
  {
    mode: "BAL",
    number: 1,
    members: [
      ["SOLO", "thor", "RAGE", "BRILLIANT"],
      ["SUPPORT_1", "iron-man", "COMPETITION", "MIGHTY"],
      ["SUPPORT_2", "captain-america", "ASCENT", "NORMAL"],
    ],
  },
];

async function main() {
  for (const [slug, name, gender, side, species, attackType] of AGENTS) {
    const agent = await prisma.agent.upsert({
      where: { slug },
      update: {},
      create: { slug, name, gender, side, species, attackType },
    });
    await prisma.uniform.upsert({
      where: { agentId_slug: { agentId: agent.id, slug: "padrao" } },
      update: {},
      create: { agentId: agent.id, slug: "padrao", name: "Padrão", imagePath: `/assets/agents/${slug}/padrao.png` },
    });
  }

  // BAX Dia 4 = "Vilão" (cenário do quickstart).
  const bax4 = await prisma.battleDay.findUniqueOrThrow({ where: { mode_number: { mode: "BAX", number: 4 } } });
  await prisma.restrictionCriterion.upsert({
    where: { battleDayId_attribute: { battleDayId: bax4.id, attribute: "SIDE" } },
    update: { value: "VILLAIN" },
    create: { battleDayId: bax4.id, attribute: "SIDE", value: "VILLAIN" },
  });

  for (const t of TEAMS) {
    const day = await prisma.battleDay.findUniqueOrThrow({ where: { mode_number: { mode: t.mode, number: t.number } } });
    await prisma.metaTeam.deleteMany({ where: { scope: "DAY", battleDayId: day.id, label: "demo" } });
    const members = [];
    for (const [slot, slug, type, quality] of t.members) {
      const uniform = await prisma.uniform.findFirstOrThrow({ where: { agent: { slug }, slug: "padrao" } });
      const ctp = await prisma.ctp.findUniqueOrThrow({ where: { type_quality: { type, quality } } });
      members.push({ slot, uniformId: uniform.id, ctpId: ctp.id });
    }
    await prisma.metaTeam.create({
      data: { scope: "DAY", battleDayId: day.id, isPrimary: true, label: "demo", members: { create: members } },
    });
  }
  console.log(`✔ Demo: ${AGENTS.length} agentes, ${TEAMS.length} equipes Meta, restrição Vilão no BAX Dia 4`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
