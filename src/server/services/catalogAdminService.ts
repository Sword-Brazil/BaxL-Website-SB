import type { AgentInput, CtpInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";

const agentData = (input: AgentInput) => ({
  slug: input.slug,
  name: input.name,
  active: input.active ?? true,
});

const uniformData = (u: AgentInput["uniforms"][number]) => ({
  slug: u.slug,
  name: u.name,
  imagePath: u.imagePath,
  active: u.active ?? true,
  gender: u.gender,
  side: u.side,
  species: u.species,
  attackType: u.attackType,
});

async function assertSlugFree(slug: string, exceptId?: string) {
  const other = await prisma.agent.findUnique({ where: { slug } });
  if (other && other.id !== exceptId) throw new HttpError(409, "CONFLICT", "Já existe um agente com esse slug");
}

export async function createAgent(input: AgentInput) {
  await assertSlugFree(input.slug);
  return prisma.agent.create({
    data: {
      ...agentData(input),
      uniforms: {
        create: input.uniforms.map(uniformData),
      },
    },
    include: { uniforms: true },
  });
}

/**
 * Edita o agente e seus uniformes. Uniformes que saírem da lista são desativados
 * (soft delete): nunca apagar o que pode estar referenciado por equipes ou seleções.
 */
export async function updateAgent(id: string, input: AgentInput) {
  const agent = await prisma.agent.findUnique({ where: { id }, include: { uniforms: true } });
  if (!agent) throw new HttpError(404, "NOT_FOUND", "Agente não encontrado");
  await assertSlugFree(input.slug, id);

  return prisma.$transaction(async (tx) => {
    await tx.agent.update({ where: { id }, data: agentData(input) });
    const keep = new Set<string>();
    for (const u of input.uniforms) {
      const existing = agent.uniforms.find((x) => x.id === u.id) ?? agent.uniforms.find((x) => x.slug === u.slug);
      const data = uniformData(u);
      if (existing) {
        await tx.uniform.update({ where: { id: existing.id }, data });
        keep.add(existing.id);
      } else {
        keep.add((await tx.uniform.create({ data: { ...data, agentId: id } })).id);
      }
    }
    await tx.uniform.updateMany({ where: { agentId: id, id: { notIn: [...keep] } }, data: { active: false } });
    return tx.agent.findUniqueOrThrow({ where: { id }, include: { uniforms: true } });
  });
}

export async function saveCtp(input: CtpInput, id?: string) {
  if (id) {
    const existing = await prisma.ctp.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "NOT_FOUND", "CTP não encontrado");
    return prisma.ctp.update({
      where: { id },
      data: { type: input.type, quality: input.quality, imagePath: input.imagePath, active: input.active ?? true },
    });
  }
  return prisma.ctp.upsert({
    where: { type_quality: { type: input.type, quality: input.quality } },
    create: { type: input.type, quality: input.quality, imagePath: input.imagePath, active: input.active ?? true },
    update: { imagePath: input.imagePath, active: input.active ?? true },
  });
}
