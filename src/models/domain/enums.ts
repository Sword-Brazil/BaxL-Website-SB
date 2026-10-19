// Enums de domínio da Batalha de Aliança. No banco (SQLite) são String validadas por Zod.

export const MODES = ["BAX", "BAL", "BAI"] as const;
export type Mode = (typeof MODES)[number];

/** Modos que têm dias com restrição (a BAI é um modo à parte). */
export const DAY_MODES = ["BAX", "BAL"] as const;
export type DayMode = (typeof DAY_MODES)[number];

export const ROLES = ["USER", "CURATOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const GENDERS = ["MALE", "FEMALE", "NONE"] as const;
export type Gender = (typeof GENDERS)[number];

export const SIDES = ["HERO", "VILLAIN"] as const;
export type Side = (typeof SIDES)[number];

export const SPECIES = ["MUTANT", "INHUMAN", "HUMAN", "ALIEN", "NEO_HUMAN", "OTHER"] as const;
export type Species = (typeof SPECIES)[number];

export const ATTACK_TYPES = ["COMBAT", "BLAST", "SPEED", "UNIVERSAL"] as const;
export type AttackType = (typeof ATTACK_TYPES)[number];

export const CRITERION_ATTRIBUTES = ["GENDER", "SIDE", "SPECIES", "ATTACK_TYPE"] as const;
export type CriterionAttribute = (typeof CRITERION_ATTRIBUTES)[number];

/** Atributo do agente ainda não informado (dados importados incompletos). Não bloqueia restrições. */
export const UNKNOWN = "UNKNOWN" as const;
export type Unknown = typeof UNKNOWN;

/** Valores válidos para cada atributo de critério de restrição. */
export const CRITERION_VALUES = {
  GENDER: GENDERS,
  SIDE: SIDES,
  SPECIES: SPECIES,
  ATTACK_TYPE: ATTACK_TYPES,
} as const satisfies Record<CriterionAttribute, readonly string[]>;

export const CTP_TYPES = [
  "RAGE", // Fúria
  "LIBERATION", // Liberação
  "INSIGHT", // Percepção
  "COMPETITION", // Competição
  "JUDGEMENT", // Julgamento
  "ASCENT", // Salto
] as const;
export type CtpType = (typeof CTP_TYPES)[number];

export const CTP_QUALITIES = ["NORMAL", "MIGHTY", "BRILLIANT"] as const;
export type CtpQuality = (typeof CTP_QUALITIES)[number];

export const SLOTS = ["SOLO", "SUPPORT_1", "SUPPORT_2"] as const;
export type Slot = (typeof SLOTS)[number];

/** Ordem na tela: Esquerda · Líder (no meio, em destaque) · Direita. */
export const DISPLAY_SLOTS = ["SUPPORT_1", "SOLO", "SUPPORT_2"] as const satisfies readonly Slot[];

export const TEAM_SCOPES = ["DAY", "BAL_FREE", "BAI"] as const;
export type TeamScope = (typeof TEAM_SCOPES)[number];

export const PRIORITY_ROLES = ["SOLO", "SUPPORT"] as const;
export type PriorityRole = (typeof PRIORITY_ROLES)[number];

export const CYCLE_LENGTH = 28;
export const WEEK_LENGTH = 7;

/** Dias do ciclo reservados à BAI (3º dia de cada semana). */
export const BAI_DAYS = [3, 10, 17, 24] as const;

/** Dia da semana de cada dia do ciclo: Dia 1 = quinta-feira. */
export const WEEKDAYS = ["QUI", "SEX", "SÁB", "DOM", "SEG", "TER", "QUA"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export function isBaiDay(dayNumber: number): boolean {
  return (BAI_DAYS as readonly number[]).includes(dayNumber);
}

export function weekdayOf(dayNumber: number): Weekday {
  return WEEKDAYS[(dayNumber - 1) % WEEK_LENGTH];
}

/** Os 24 números de dia válidos para BAX/BAL. */
export const BATTLE_DAY_NUMBERS: readonly number[] = Array.from(
  { length: CYCLE_LENGTH },
  (_, i) => i + 1,
).filter((n) => !isBaiDay(n));
