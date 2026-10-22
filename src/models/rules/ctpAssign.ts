import type { UserSelections } from "@/models/schemas/selections";

type Equipment = UserSelections["equipment"];

/** Cada personagem tem até dois CTPs: o 1 (padrão) e o 2 (opcional), alternados por dia. */
export type CtpSlot = 1 | 2;
export const CTP_SLOTS = [1, 2] as const satisfies readonly CtpSlot[];

/** CTP do slot pedido; sem CTP 2, vale o 1. */
export const slotCtpId = (ctp1: string | null | undefined, ctp2: string | null | undefined, slot: CtpSlot | null | undefined) =>
  (slot === 2 ? (ctp2 ?? ctp1) : ctp1) ?? null;

/** Equipa (ou remove, com null) o CTP de um slot do personagem. */
export function equipCtp(equipment: Equipment, agentId: string, ctpId: string | null, slot: CtpSlot = 1): Equipment {
  const key = slot === 2 ? "ctp2ByAgent" : "ctpByAgent";
  const map = { ...(equipment[key] ?? {}) };
  if (ctpId) map[agentId] = ctpId;
  else delete map[agentId];
  return { ...equipment, [key]: map };
}

/** Os dois CTPs do personagem no elenco do jogador. */
export const equippedCtps = (equipment: Equipment | undefined, agentId: string) => ({
  ctp1: equipment?.ctpByAgent?.[agentId] ?? null,
  ctp2: equipment?.ctp2ByAgent?.[agentId] ?? null,
});

/**
 * CTP do personagem numa equipe do jogador: o do slot escolhido para o dia. Equipes antigas (antes
 * dos slots) guardavam o CTP do dia direto (`ctpId`), que continua valendo até o jogador escolher um slot.
 */
export function dayCtpId(
  pick: { ctpId?: string | null; ctpSlot?: CtpSlot | null } | null | undefined,
  equipment: Equipment | undefined,
  agentId: string | undefined,
): string | null {
  const { ctp1, ctp2 } = agentId ? equippedCtps(equipment, agentId) : { ctp1: null, ctp2: null };
  if (pick?.ctpSlot) return slotCtpId(ctp1, ctp2, pick.ctpSlot);
  return pick?.ctpId ?? ctp1;
}
