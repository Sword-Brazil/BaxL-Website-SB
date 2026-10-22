import type { Agent, CycleOverview } from "@/models/domain/types";

/** Uniformes usados em alguma equipe (Meta/Alternativa) do ciclo ou da BAI. */
export function uniformsInTeams(cycle: CycleOverview | undefined): Set<string> {
  const teams = cycle
    ? [...cycle.days.flatMap((d) => [...(d.bax?.metaTeams ?? []), ...(d.bal?.metaTeams ?? [])]), ...cycle.bai.metaTeams]
    : [];
  return new Set(teams.flatMap((t) => t.members.map((m) => m.uniformId)));
}

/**
 * Trajes exibidos no elenco: o "Padrão" some quando o personagem tem outros trajes e o Padrão
 * não é usado em nenhuma equipe (o personagem é jogado com traje).
 */
export function visibleUniforms(agent: Agent, used: ReadonlySet<string>) {
  const active = agent.uniforms.filter((u) => u.active);
  const hasCostume = active.some((u) => u.slug !== "padrao");
  return active.filter((u) => !(u.slug === "padrao" && hasCostume && !used.has(u.id)));
}

/** Personagens que aparecem no elenco: ativos e com ao menos um traje para marcar. */
export const rosterAgents = (agents: Agent[], used: ReadonlySet<string>) =>
  agents.filter((a) => a.active && visibleUniforms(a, used).length > 0);

/**
 * Personagens possuídos, contados como nos cartões do elenco: só valem trajes visíveis (marcações
 * antigas de trajes desativados ou ocultos não contam).
 */
export const ownedAgentIds = (agents: Agent[], owned: ReadonlySet<string>, used: ReadonlySet<string>) =>
  new Set(rosterAgents(agents, used).filter((a) => visibleUniforms(a, used).some((u) => owned.has(u.id))).map((a) => a.id));
