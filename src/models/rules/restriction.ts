import { UNKNOWN, type CriterionAttribute } from "@/models/domain/enums";
import type { Criterion, RestrictableAttributes, UniformOverrides } from "@/models/domain/types";

const FIELD: Record<CriterionAttribute, keyof RestrictableAttributes> = {
  GENDER: "gender",
  SIDE: "side",
  SPECIES: "species",
  ATTACK_TYPE: "attackType",
};

export const RESTRICTABLE_FIELDS = Object.values(FIELD);

/** Atributos efetivos de um traje: os próprios ou, se não tiver, os do personagem. */
export function resolveAttributes(
  agent: RestrictableAttributes,
  overrides: Partial<UniformOverrides>,
): RestrictableAttributes {
  return {
    gender: overrides.gender ?? agent.gender,
    side: overrides.side ?? agent.side,
    species: overrides.species ?? agent.species,
    attackType: overrides.attackType ?? agent.attackType,
  };
}

/**
 * Regra "E": o traje atende ao dia se atender a todos os critérios. Sem critérios = sem restrição.
 * Atributo "não informado" (UNKNOWN) não bloqueia: os curadores completam no catálogo.
 */
export function matchesRestriction(subject: RestrictableAttributes, criteria: readonly Criterion[]): boolean {
  return criteria.every((c) => {
    const value = subject[FIELD[c.attribute]];
    return value === UNKNOWN || value === c.value;
  });
}
