import type { UserSelections } from "@/models/schemas/selections";

type Equipment = UserSelections["equipment"];

/** Equipa (ou remove, com null) o CTP de um personagem. Cada personagem tem no máximo um CTP. */
export function equipCtp(equipment: Equipment, agentId: string, ctpId: string | null): Equipment {
  const ctpByAgent = { ...equipment.ctpByAgent };
  if (ctpId) ctpByAgent[agentId] = ctpId;
  else delete ctpByAgent[agentId];
  return { ctpByAgent };
}
