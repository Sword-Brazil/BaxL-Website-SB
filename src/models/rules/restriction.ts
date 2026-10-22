import { UNKNOWN, type CriterionAttribute } from "@/models/domain/enums";
import type { Criterion, RestrictableAttributes } from "@/models/domain/types";

const FIELD: Record<CriterionAttribute, keyof RestrictableAttributes> = {
  GENDER: "gender",
  SIDE: "side",
  SPECIES: "species",
  ATTACK_TYPE: "attackType",
};

export const RESTRICTABLE_FIELDS = Object.values(FIELD);

/**
 * Regra "E": o traje atende ao dia se atender a todos os critérios. Sem critérios = sem restrição.
 * Atributo "não informado" (UNKNOWN) não bloqueia na curadoria (os curadores completam no
 * catálogo); com `strict` (montagem do jogador), só entra quem tem exatamente as tags do dia.
 */
export function matchesRestriction(
  subject: RestrictableAttributes,
  criteria: readonly Criterion[],
  { strict = false }: { strict?: boolean } = {},
): boolean {
  return criteria.every((c) => {
    const value = subject[FIELD[c.attribute]];
    return value === c.value || (!strict && value === UNKNOWN);
  });
}
