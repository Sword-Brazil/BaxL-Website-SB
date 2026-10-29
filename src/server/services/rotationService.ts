import { BOSS_EFFECTS } from "@/models/domain/enums";
import type { Rotation } from "@/models/domain/types";
import type { AgentRotationsInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";

type DbRotation = Omit<Rotation, "updatedAt" | "effectVideos"> & { effectVideos: unknown; updatedAt: Date };

/** Só os efeitos conhecidos com link (o JSON do banco não tem tipo). */
const toEffectVideos = (raw: unknown): Rotation["effectVideos"] => {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(BOSS_EFFECTS.flatMap((e) => (typeof obj[e] === "string" && obj[e] ? [[e, obj[e]]] : [])));
};

const toRotation = (r: DbRotation): Rotation => ({
  id: r.id,
  agentId: r.agentId,
  uniformId: r.uniformId,
  position: r.position,
  title: r.title,
  titleEn: r.titleEn,
  sequence: r.sequence,
  description: r.description,
  descriptionEn: r.descriptionEn,
  videoUrl: r.videoUrl,
  videoBax: r.videoBax,
  videoBal: r.videoBal,
  videoBai: r.videoBai,
  effectVideos: toEffectVideos(r.effectVideos),
  updatedAt: r.updatedAt.toISOString(),
});

/** Todas as rotações (lista pequena): a tela pública filtra por personagem. */
export async function listRotations(): Promise<Rotation[]> {
  const rows = await prisma.rotation.findMany({ orderBy: [{ agentId: "asc" }, { position: "asc" }] });
  return rows.map(toRotation);
}

/**
 * Substitui as rotações de um personagem pela lista enviada, na ordem dela. Cada rotação vale
 * para um traje do próprio personagem ou, sem traje, para todos.
 */
export async function saveAgentRotations(agentId: string, input: AgentRotationsInput): Promise<Rotation[]> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId }, include: { uniforms: { select: { id: true } } } });
  if (!agent) throw new HttpError(404, "NOT_FOUND", "Agente não encontrado");
  const own = new Set(agent.uniforms.map((u) => u.id));
  if (input.rotations.some((r) => r.uniformId && !own.has(r.uniformId))) {
    throw new HttpError(400, "VALIDATION_ERROR", "Traje não pertence a este agente");
  }

  const rows = await prisma.$transaction(async (tx) => {
    // Modos em que pontua: automático ou os escolhidos (ausente = mantém).
    if (input.scoring) {
      await tx.agent.update({ where: { id: agentId }, data: { scoringAuto: input.scoring.auto, scoringModes: input.scoring.modes } });
    }
    await tx.rotation.deleteMany({ where: { agentId } });
    for (const [position, r] of input.rotations.entries()) {
      await tx.rotation.create({
        data: {
          agentId,
          uniformId: r.uniformId,
          position,
          title: r.title || null,
          titleEn: r.titleEn || null,
          sequence: r.sequence,
          description: r.description || null,
          descriptionEn: r.descriptionEn || null,
          videoUrl: r.videoUrl || null,
          videoBax: r.videoBax || null,
          videoBal: r.videoBal || null,
          videoBai: r.videoBai || null,
          effectVideos: toEffectVideos(r.effectVideos),
        },
      });
    }
    return tx.rotation.findMany({ where: { agentId }, orderBy: { position: "asc" } });
  });
  return rows.map(toRotation);
}
