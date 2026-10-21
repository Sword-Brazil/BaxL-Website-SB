import { BATTLE_DAY_NUMBERS, CTP_QUALITIES, CTP_TYPES, DAY_MODES } from "@/models/domain/enums";
import { prisma } from "@/server/db";

/** Dias de BAX/BAL e os 21 CTPs, como no seed. */
export async function seedBase() {
  await prisma.ctp.createMany({
    data: CTP_TYPES.flatMap((type) =>
      CTP_QUALITIES.map((quality) => ({ type, quality, imagePath: `/assets/ctp/${type.toLowerCase()}.png` })),
    ),
  });
  await prisma.battleDay.createMany({
    data: DAY_MODES.flatMap((mode) => BATTLE_DAY_NUMBERS.map((number) => ({ mode, number }))),
  });
}

export async function createAgent(
  slug: string,
  attrs: { gender?: string; side?: string; species?: string; attackType?: string; active?: boolean } = {},
) {
  const agent = await prisma.agent.create({
    data: {
      slug,
      name: slug,
      active: attrs.active ?? true,
      uniforms: {
        create: {
          slug: "padrao",
          name: "Padrão",
          imagePath: `/assets/agents/${slug}/padrao.png`,
          gender: attrs.gender ?? "MALE",
          side: attrs.side ?? "HERO",
          species: attrs.species ?? "HUMAN",
          attackType: attrs.attackType ?? "COMBAT",
        },
      },
    },
    include: { uniforms: true },
  });
  return { agent, uniform: agent.uniforms[0] };
}

export const ctpId = async (type = "RAGE", quality = "BRILLIANT") =>
  (await prisma.ctp.findUniqueOrThrow({ where: { type_quality: { type, quality } } })).id;

export const dayId = async (mode: string, number: number) =>
  (await prisma.battleDay.findUniqueOrThrow({ where: { mode_number: { mode, number } } })).id;

export async function createUser(role = "USER", username = role.toLowerCase()) {
  return prisma.user.create({ data: { username, passwordHash: "x", role, nickname: role.toLowerCase() } });
}

export async function createMetaTeam(opts: {
  scope: string;
  battleDayId?: string | null;
  isPrimary?: boolean;
  uniformIds: [string, string, string];
  updatedById?: string;
  label?: string;
}) {
  const ctp = await ctpId();
  return prisma.metaTeam.create({
    data: {
      scope: opts.scope,
      battleDayId: opts.battleDayId ?? null,
      isPrimary: opts.isPrimary ?? false,
      label: opts.label ?? null,
      updatedById: opts.updatedById,
      members: {
        create: (["SOLO", "SUPPORT_1", "SUPPORT_2"] as const).map((slot, i) => ({
          slot,
          uniformId: opts.uniformIds[i],
          ctpId: ctp,
        })),
      },
    },
  });
}
