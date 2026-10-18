// Importa o snapshot do Guia BAX/BAL/BAI (prisma/data/guiabaxbal-*.json) para o banco:
// agentes e trajes, restrições dos 28 dias e equipes Meta e Alternativa (BAX, BAL e BAI). As listas
// da sugestão saem das equipes na hora (effectivePriority); reservas cadastradas são mantidas. Uso: npm run import:guiabaxbal [-- --replace | --attributes-only]
// - Agentes: cria os que faltam; atributos só são preenchidos onde ainda estão "não informados".
// - Trajes: atributos próprios (deduzidos das equipes) só onde o traje ainda não tem e o valor
//   difere do personagem (ex.: Jean Grey "Fênix Negra" vilã).
// - Equipes: só substitui as existentes com --replace.
// - --attributes-only: só agentes, trajes e atributos; não mexe em restrições nem equipes.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { CRITERION_ATTRIBUTES, UNKNOWN } from "../src/models/domain/enums";
import { convertSnapshot, DEFAULT_UNIFORM, slugify, type ImportedTeam } from "../src/models/import/guiabaxbal";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const prisma = new PrismaClient();
const FIELD = { GENDER: "gender", SIDE: "side", SPECIES: "species", ATTACK_TYPE: "attackType" } as const;

async function main() {
  const replace = process.argv.includes("--replace");
  const attributesOnly = process.argv.includes("--attributes-only");
  const dir = path.join("prisma", "data");
  const file = readdirSync(dir).filter((f) => f.startsWith("guiabaxbal-")).sort().at(-1);
  if (!file) throw new Error("Snapshot prisma/data/guiabaxbal-*.json não encontrado");
  const { agents, days, bai } = convertSnapshot(JSON.parse(readFileSync(path.join(dir, file), "utf8")));
  console.log(`Snapshot ${file}: ${agents.length} agentes, ${days.length} dias, BAI ${bai.length ? "sim" : "não"}`);

  const existingTeams = await prisma.metaTeam.count({ where: { scope: { in: ["DAY", "BAI"] } } });
  if (existingTeams && !replace && !attributesOnly) {
    console.error(`✖ Já existem ${existingTeams} equipes de dia/BAI. Rode com --replace para substituí-las.`);
    process.exit(1);
  }

  // Agentes e trajes
  const uniformId = new Map<string, string>(); // "agente|traje" → id
  let overridden = 0;
  for (const a of agents) {
    const current = await prisma.agent.findUnique({ where: { slug: a.slug } });
    const attrs = Object.fromEntries(
      CRITERION_ATTRIBUTES.map((k) => {
        const mine = current?.[FIELD[k]];
        return [FIELD[k], mine && mine !== UNKNOWN ? mine : a.attributes[k]];
      }),
    ) as Record<(typeof FIELD)[keyof typeof FIELD], string>;
    const agent = current
      ? await prisma.agent.update({ where: { id: current.id }, data: attrs })
      : await prisma.agent.create({ data: { slug: a.slug, name: a.name, ...attrs } });
    for (const name of a.uniforms) {
      const slug = name === DEFAULT_UNIFORM ? "padrao" : slugify(name);
      let u = await prisma.uniform.upsert({
        where: { agentId_slug: { agentId: agent.id, slug } },
        update: {},
        create: { agentId: agent.id, slug, name, imagePath: "" },
      });
      const own = Object.fromEntries(
        Object.entries(a.uniformAttributes[name] ?? {}).flatMap(([k, value]) => {
          const field = FIELD[k as keyof typeof FIELD];
          return u[field] === null && agent[field] !== value ? [[field, value]] : [];
        }),
      );
      if (Object.keys(own).length) {
        u = await prisma.uniform.update({ where: { id: u.id }, data: own });
        overridden++;
      }
      uniformId.set(`${a.name}|${name}`, u.id);
    }
  }
  console.log(`✔ agentes e trajes (${overridden} trajes com atributos próprios novos)`);
  if (attributesOnly) return;

  // As equipes do guia trazem só o tipo do CTP: guardamos a linha "Brilhante" do tipo.
  const ctps = await prisma.ctp.findMany({ where: { quality: "BRILLIANT" } });
  const ctpOfType = new Map(ctps.map((c) => [c.type, c.id]));
  const uid = (agent: string, uniform: string) => uniformId.get(`${agent}|${uniform || DEFAULT_UNIFORM}`)!;

  const writeTeams = async (scope: string, battleDayId: string | null, teams: ImportedTeam[]) => {
    await prisma.metaTeam.deleteMany({ where: { scope, battleDayId } });
    for (const t of teams) {
      await prisma.metaTeam.create({
        data: {
          scope,
          battleDayId,
          isPrimary: t.isPrimary,
          label: t.isPrimary ? null : "Alternativa",
          members: {
            create: t.members.map((m) => ({
              slot: m.slot,
              uniformId: uid(m.agent, m.uniform),
              ctpId: m.ctpType ? (ctpOfType.get(m.ctpType) ?? null) : null,
            })),
          },
        },
      });
    }
  };

  for (const d of days) {
    const day = await prisma.battleDay.findUniqueOrThrow({ where: { mode_number: { mode: d.mode, number: d.number } } });
    await prisma.restrictionCriterion.deleteMany({ where: { battleDayId: day.id } });
    await prisma.restrictionCriterion.createMany({ data: d.criteria.map((c) => ({ battleDayId: day.id, ...c })) });
    await writeTeams("DAY", day.id, d.teams);
  }
  console.log(`✔ restrições e equipes de ${days.length} dias`);
  await writeTeams("BAI", null, bai);
  console.log("✔ equipes da BAI");

  const unknown = await prisma.agent.count({
    where: { OR: Object.values(FIELD).map((f) => ({ [f]: UNKNOWN })) },
  });
  console.log(`\n${unknown} agentes com algum atributo "não informado": complete em /admin/catalogo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
