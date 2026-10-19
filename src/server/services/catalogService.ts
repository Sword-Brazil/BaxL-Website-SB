import { CTP_QUALITIES, CTP_TYPES, type AttackType, type CtpQuality, type CtpType, type Gender, type Side, type Species } from "@/models/domain/enums";
import type { Agent, Catalog, Ctp } from "@/models/domain/types";
import { catalogRepository } from "@/server/repositories/catalogRepository";

/**
 * Catálogo completo, incluindo agentes e uniformes inativos (`active: false`):
 * seleções antigas precisam de nome/imagem para exibir "indisponível".
 * Telas de escolha filtram `active: true`.
 */
export async function getCatalog(): Promise<Catalog> {
  const [agents, ctps] = await Promise.all([catalogRepository.listAgents(), catalogRepository.listCtps()]);
  return {
    agents: agents.map((a): Agent => {
      const fallback =
        a.uniforms.find((u) => u.slug === "padrao" && u.imagePath)?.imagePath ??
        a.uniforms.find((u) => u.imagePath)?.imagePath ??
        "";
      return {
        id: a.id,
        slug: a.slug,
        name: a.name,
        active: a.active,
        uniforms: a.uniforms.map((u) => ({
          id: u.id,
          agentId: u.agentId,
          slug: u.slug,
          name: u.name,
          imagePath: u.imagePath,
          portrait: u.imagePath || fallback,
          active: u.active && a.active,
          gender: u.gender as Gender,
          side: u.side as Side,
          species: u.species as Species,
          attackType: u.attackType as AttackType,
        })),
      };
    }),
    ctps: ctps
      .map((c): Ctp => ({ id: c.id, type: c.type as CtpType, quality: c.quality as CtpQuality, imagePath: c.imagePath, active: c.active }))
      .sort(
        (x, y) =>
          CTP_TYPES.indexOf(x.type) - CTP_TYPES.indexOf(y.type) ||
          CTP_QUALITIES.indexOf(x.quality) - CTP_QUALITIES.indexOf(y.quality),
      ),
  };
}
