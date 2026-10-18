import type { UserSelections } from "@/models/schemas/selections";

export const emptySelections = (): UserSelections => ({
  version: 1,
  updatedAt: new Date(0).toISOString(),
  roster: { ownedUniformIds: [] },
  teams: {},
  equipment: { ctpByAgent: {} },
});

/** Representação canônica do conteúdo (ignora updatedAt e ordem). */
function contentKey(doc: UserSelections): string {
  const teams = Object.keys(doc.teams)
    .sort()
    .map((k) => [k, doc.teams[k]] as const)
    .filter(([, t]) => Object.values(t).some(Boolean));
  const equipment = Object.entries(doc.equipment?.ctpByAgent ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify([[...doc.roster.ownedUniformIds].sort(), teams, equipment]);
}

export const isEmptySelections = (doc: UserSelections) => contentKey(doc) === contentKey(emptySelections());

export type MergeDecision = "UPLOAD_LOCAL" | "USE_REMOTE" | "ASK_USER" | "IN_SYNC";

/** O que fazer ao entrar na conta com seleções locais e (talvez) remotas. Nada é descartado sem perguntar. */
export function mergeDecision(local: UserSelections, remote: UserSelections | null): MergeDecision {
  if (!remote) return isEmptySelections(local) ? "IN_SYNC" : "UPLOAD_LOCAL";
  if (contentKey(local) === contentKey(remote)) return "IN_SYNC";
  if (isEmptySelections(local)) return "USE_REMOTE";
  return "ASK_USER";
}
