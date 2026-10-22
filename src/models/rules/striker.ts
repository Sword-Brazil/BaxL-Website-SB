import type { Agent } from "@/models/domain/types";

/** Há algum traje ativo marcado como Striker meta no catálogo. */
export const hasMetaStrikerTags = (agents: Agent[]) => agents.some((a) => a.active && a.uniforms.some((u) => u.active && u.isMetaStriker));

/**
 * Opções do seletor de Striker: só os trajes marcados como Striker meta. Enquanto nenhum traje do
 * catálogo estiver marcado, todos continuam aparecendo (o seletor não fica vazio).
 */
export const metaStrikerOptions = <T extends { uniform: { isMetaStriker: boolean } }>(options: T[], anyTagged: boolean): T[] =>
  anyTagged ? options.filter((o) => o.uniform.isMetaStriker) : options;
