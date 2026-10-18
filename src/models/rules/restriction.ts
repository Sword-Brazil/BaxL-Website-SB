import { UNKNOWN, type CriterionAttribute } from "@/models/domain/enums";
import type { Agent, Criterion } from "@/models/domain/types";

type RestrictableAgent = Pick<Agent, "gender" | "side" | "species" | "attackType">;

const FIELD: Record<CriterionAttribute, keyof RestrictableAgent> = {
  GENDER: "gender",
  SIDE: "side",
  SPECIES: "species",
  ATTACK_TYPE: "attackType",
};

/**
 * Regra "E": o agente atende ao dia se atender a todos os critérios. Sem critérios = sem restrição.
 * Atributo "não informado" (UNKNOWN) não bloqueia: os curadores completam no catálogo.
 */
export function matchesRestriction(agent: RestrictableAgent, criteria: readonly Criterion[]): boolean {
  return criteria.every((c) => {
    const value = agent[FIELD[c.attribute]];
    return value === UNKNOWN || value === c.value;
  });
}
