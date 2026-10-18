import type { CycleOverview } from "@/models/domain/types";

/**
 * Dias cujas equipes Meta/Alternativa mudaram depois de `since` (ISO), na ordem do ciclo.
 * "BAI" aparece uma vez se alguma equipe da BAI mudou.
 */
export function changedMetaDays(cycle: CycleOverview, since: string): string[] {
  const changed = (teams: { updatedAt: string }[]) => teams.some((t) => t.updatedAt > since);
  const days = cycle.days.flatMap((d) =>
    (["bax", "bal"] as const).flatMap((k) => (d[k] && changed(d[k]!.metaTeams) ? [`${k.toUpperCase()} ${d.number}`] : [])),
  );
  return changed(cycle.bai.metaTeams) ? [...days, "BAI"] : days;
}
