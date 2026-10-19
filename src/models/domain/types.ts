import type {
  Unknown,
  AttackType,
  CriterionAttribute,
  CtpQuality,
  CtpType,
  DayMode,
  Gender,
  PriorityRole,
  Role,
  Side,
  Slot,
  Species,
  TeamScope,
  Weekday,
} from "./enums";

/** Atributos que contam para as restrições dos dias. */
export interface RestrictableAttributes {
  gender: Gender | Unknown;
  side: Side | Unknown;
  species: Species | Unknown;
  attackType: AttackType | Unknown;
}

/** Traje: os atributos (gênero, lado, espécie, ataque) são de cada traje, não do personagem. */
export interface Uniform extends RestrictableAttributes {
  id: string;
  agentId: string;
  slug: string;
  name: string;
  imagePath: string;
  /** Imagem a exibir: a do traje ou, se ele não tiver, o retrato do personagem ("" = iniciais). */
  portrait: string;
  active: boolean;
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  uniforms: Uniform[];
}

export interface Ctp {
  id: string;
  type: CtpType;
  quality: CtpQuality;
  imagePath: string;
  active: boolean;
}

export interface Criterion {
  attribute: CriterionAttribute;
  value: string;
}

export interface MetaTeamMember {
  slot: Slot;
  uniformId: string;
  /** CTP recomendado. As equipes importadas trazem só o tipo; null = sem recomendação. */
  ctpId: string | null;
  /** Causador de Dano (qualquer posição): é quem tem rotação. */
  isDamageDealer: boolean;
  /** Rotação na forma canônica (ver src/models/rules/rotation.ts); só para Causador de Dano. */
  rotation: string | null;
  /** Descrição da rotação (quando usar, o que observar). */
  rotationNotes: string | null;
}

export interface MetaTeam {
  id: string;
  scope: TeamScope;
  mode: DayMode | null;
  dayNumber: number | null;
  isPrimary: boolean;
  label: string | null;
  notes: string | null;
  members: MetaTeamMember[];
  updatedAt: string;
  updatedBy: string | null;
}

export interface PriorityItem {
  rank: number;
  uniformId: string;
  ctpId: string | null;
}

export interface PriorityLists {
  solo: PriorityItem[];
  support: PriorityItem[];
}

export type PriorityEntry = PriorityItem & { role: PriorityRole };

export interface BaiBoss {
  id: string;
  position: number;
  name: string;
  imagePath: string | null;
  tips: string | null;
}

export interface Settings {
  /** Instante (ISO, UTC) de início do Dia 1 do ciclo: quinta-feira 12:00 BRT. */
  cycleAnchor: string;
  dayTurnoverHour: number;
  weeklyResetHour: number;
  baiWeekday: number;
}

export interface SessionUser {
  id: string;
  email: string;
  nickname: string | null;
  role: Role;
}

export interface BattleClock {
  /** Dia do ciclo (1–28). Muda somente na virada diária (12:00 BRT). */
  cycleDay: number;
  /** Semana da pontuação (0–3). Muda no reset semanal (22:00 BRT). */
  weekIndex: number;
  mode: "BAX_BAL" | "BAI";
  weekday: Weekday;
  /** Este dia de batalha contém o reset semanal. */
  isResetDay: boolean;
  /** No dia de reset: ainda antes das 22:00 (pontuação conta para a semana anterior). */
  beforeWeeklyReset: boolean;
  /** Início (ISO) do dia de batalha atual. */
  dayStart: string;
  /** Início (ISO) do próximo dia de batalha. */
  nextDayStart: string;
  /** Início (ISO) da BAI atual ou da próxima. */
  nextBaiStart: string;
  now: string;
}

export interface DaySummary {
  mode: DayMode;
  number: number;
  weekday: Weekday;
  criteria: Criterion[];
  primaryTeam: MetaTeam | null;
  updatedAt: string | null;
}

export interface DayDetail {
  mode: DayMode;
  number: number;
  weekday: Weekday;
  criteria: Criterion[];
  metaTeams: MetaTeam[];
  priority: PriorityLists;
}

export interface BaiContent {
  bosses: BaiBoss[];
  metaTeams: MetaTeam[];
  priority: PriorityLists;
  nextStart: string;
}

export interface Catalog {
  agents: Agent[];
  ctps: Ctp[];
}

/** Um modo (BAX ou BAL) dentro de um dia do ciclo. */
export interface CycleModeDay {
  criteria: Criterion[];
  /** Equipe Meta (principal) primeiro, depois as alternativas. */
  metaTeams: MetaTeam[];
  /** Usada na sugestão: gerada das equipes, seguida das reservas. */
  priority: PriorityLists;
  /** Reservas cadastradas pelos curadores (além das equipes). */
  reserves: PriorityLists;
}

export interface CycleDay {
  number: number;
  weekday: Weekday;
  /** Semana do ciclo (1–4). */
  week: number;
  isBai: boolean;
  bax: CycleModeDay | null;
  bal: CycleModeDay | null;
}

/** O ciclo inteiro de 28 dias para a tela central, mais o conteúdo único da BAI. */
export interface CycleOverview {
  days: CycleDay[];
  bai: { metaTeams: MetaTeam[]; bosses: BaiBoss[]; priority: PriorityLists; reserves: PriorityLists };
}
