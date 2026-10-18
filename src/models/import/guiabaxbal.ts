// Conversão (pura) do snapshot do Guia BAX/BAL/BAI para o modelo do MFF System.
// Gravação no banco: scripts/import-guiabaxbal.ts.
import {
  BAI_DAYS,
  CRITERION_ATTRIBUTES,
  CTP_TYPES,
  UNKNOWN,
  type CriterionAttribute,
  type CtpType,
  type DayMode,
  type Slot,
} from "@/models/domain/enums";
import type { Criterion } from "@/models/domain/types";
import { slugify } from "@/models/rules/slug";

type Row = Record<string, string>;

export interface GuiaSnapshot {
  baxData: Row[];
  balData: Row[];
  masterCharacters: string[];
  charCostumes: Record<string, string[]>;
  customLists: Record<string, Record<string, string[]>>;
}

export interface ImportedMember {
  slot: Slot;
  agent: string;
  /** Nome do traje; "" = visual padrão. */
  uniform: string;
  ctpType: CtpType | null;
}

export interface ImportedTeam {
  isPrimary: boolean;
  members: ImportedMember[];
}

export interface ImportedAgent {
  name: string;
  slug: string;
  attributes: Record<CriterionAttribute, string>;
  uniforms: string[];
  /** Atributos de cada traje deduzidos só das equipes em que ele aparece (sem conflito). */
  uniformAttributes: Record<string, Partial<Record<CriterionAttribute, string>>>;
}

export interface ImportedDay {
  mode: DayMode;
  number: number;
  criteria: Criterion[];
  teams: ImportedTeam[];
}

/** Tokens de restrição do guia → critérios do nosso modelo. */
const TOKEN: Record<string, Criterion> = {
  speed: { attribute: "ATTACK_TYPE", value: "SPEED" },
  combat: { attribute: "ATTACK_TYPE", value: "COMBAT" },
  blast: { attribute: "ATTACK_TYPE", value: "BLAST" },
  universal: { attribute: "ATTACK_TYPE", value: "UNIVERSAL" },
  hero: { attribute: "SIDE", value: "HERO" },
  villain: { attribute: "SIDE", value: "VILLAIN" },
  male: { attribute: "GENDER", value: "MALE" },
  female: { attribute: "GENDER", value: "FEMALE" },
  mutant: { attribute: "SPECIES", value: "MUTANT" },
  human: { attribute: "SPECIES", value: "HUMAN" },
  alien: { attribute: "SPECIES", value: "ALIEN" },
  inhuman: { attribute: "SPECIES", value: "INHUMAN" },
};

/** Posições do guia ("Líder", "Pos. 1", "Pos. 2") → slots. */
const SLOT_KEYS: [Slot, string][] = [
  ["SOLO", "Líder"],
  ["SUPPORT_1", "Pos. 1"],
  ["SUPPORT_2", "Pos. 2"],
];

export const DEFAULT_UNIFORM = "Padrão";

export { slugify };

export function parseRestriction(raw: string): Criterion[] {
  const criteria: Criterion[] = [];
  for (const token of raw.replace("INFINITE", "").trim().split("|")) {
    const c = TOKEN[token.trim()];
    if (c && !criteria.some((x) => x.attribute === c.attribute)) criteria.push(c);
  }
  return criteria;
}

function parseTeam(row: Row, prefix: "" | "Alt "): ImportedTeam | null {
  const members: ImportedMember[] = [];
  for (const [slot, key] of SLOT_KEYS) {
    const agent = (row[`${prefix}${key}`] ?? "").trim();
    if (!agent) return null;
    const ctp = (row[`${prefix}${key}_CTP`] ?? "").trim().toUpperCase();
    members.push({
      slot,
      agent,
      uniform: (row[`${prefix}${key}_Traje`] ?? "").trim(),
      ctpType: (CTP_TYPES as readonly string[]).includes(ctp) ? (ctp as CtpType) : null,
    });
  }
  return { isPrimary: prefix === "", members };
}

const teamsOf = (row: Row) => [parseTeam(row, ""), parseTeam(row, "Alt ")].filter((t): t is ImportedTeam => !!t);

/**
 * Converte o snapshot. Atributos dos agentes são deduzidos das restrições dos dias em que eles
 * aparecem (equipes e listas do dia); valor ausente ou conflitante (trajes que mudam atributos)
 * vira "não informado" (UNKNOWN), que não bloqueia restrições. Os atributos de cada traje vêm só
 * das equipes, onde o traje é conhecido.
 */
export function convertSnapshot(snap: GuiaSnapshot) {
  const days: ImportedDay[] = [];
  let bai: ImportedTeam[] = [];
  const seen = new Map<string, Map<CriterionAttribute, Set<string>>>();
  const uniformsOf = new Map<string, Set<string>>();
  const seenUniform = new Map<string, Map<CriterionAttribute, Set<string>>>(); // "agente|traje"

  const touch = (agent: string) => {
    if (!seen.has(agent)) seen.set(agent, new Map(CRITERION_ATTRIBUTES.map((a) => [a, new Set<string>()])));
    if (!uniformsOf.has(agent)) uniformsOf.set(agent, new Set([DEFAULT_UNIFORM]));
    return seen.get(agent)!;
  };

  for (const [mode, rows] of [
    ["BAX", snap.baxData],
    ["BAL", snap.balData],
  ] as const) {
    for (const row of rows) {
      const number = Number(row["Dia"]);
      const teams = teamsOf(row);
      if ((BAI_DAYS as readonly number[]).includes(number)) {
        if (!bai.length && teams.length) bai = teams;
        continue;
      }
      const criteria = parseRestriction(row["Restrição"] ?? "");
      days.push({ mode, number, criteria, teams });
      for (const m of teams.flatMap((t) => t.members)) {
        const key = `${m.agent}|${m.uniform || DEFAULT_UNIFORM}`;
        if (!seenUniform.has(key)) seenUniform.set(key, new Map(CRITERION_ATTRIBUTES.map((a) => [a, new Set<string>()])));
        for (const c of criteria) seenUniform.get(key)!.get(c.attribute)!.add(c.value);
      }
      const listed = Object.values(snap.customLists[`${mode.toLowerCase()}-${number}`] ?? {}).flat();
      for (const agent of [...teams.flatMap((t) => t.members.map((m) => m.agent)), ...listed]) {
        const attrs = touch(agent);
        for (const c of criteria) attrs.get(c.attribute)!.add(c.value);
      }
    }
  }

  for (const t of [...days.flatMap((d) => d.teams), ...bai]) {
    for (const m of t.members) {
      touch(m.agent);
      if (m.uniform) uniformsOf.get(m.agent)!.add(m.uniform);
    }
  }
  for (const name of snap.masterCharacters) touch(name);
  for (const [name, costumes] of Object.entries(snap.charCostumes)) {
    touch(name);
    for (const c of costumes) if (c.trim()) uniformsOf.get(name)!.add(c.trim());
  }

  const single = (attrs: Map<CriterionAttribute, Set<string>>) =>
    CRITERION_ATTRIBUTES.flatMap((a) => (attrs.get(a)!.size === 1 ? [[a, [...attrs.get(a)!][0]] as const] : []));

  const agents: ImportedAgent[] = [...seen.entries()]
    .map(([name, attrs]) => {
      const known = Object.fromEntries(single(attrs));
      const uniforms = [...uniformsOf.get(name)!];
      return {
        name,
        slug: slugify(name),
        attributes: Object.fromEntries(CRITERION_ATTRIBUTES.map((a) => [a, known[a] ?? UNKNOWN])) as Record<
          CriterionAttribute,
          string
        >,
        uniforms,
        uniformAttributes: Object.fromEntries(
          uniforms.flatMap((u) => {
            const attrs = seenUniform.get(`${name}|${u}`);
            return attrs ? [[u, Object.fromEntries(single(attrs))]] : [];
          }),
        ),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return { agents, days, bai };
}
