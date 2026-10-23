import type {
  Unknown,
  AttackType,
  BalEffect,
  BaxEffect,
  BossEffect,
  CriterionAttribute,
  CtpQuality,
  CtpType,
  DayMode,
  Mode,
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
  /** Nome em inglês (o espanhol usa o mesmo); null = só o português. */
  nameEn: string | null;
  imagePath: string;
  /** Imagem a exibir: a do traje ou, se ele não tiver, o retrato do personagem ("" = iniciais). */
  portrait: string;
  active: boolean;
  /** Efeitos que o traje causa no chefe da BA (para atordoá-lo na temporada certa). */
  effects: BossEffect[];
  /** Striker meta: aparece no seletor de Striker dos Causadores de Dano. */
  isMetaStriker: boolean;
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  active: boolean;
  uniforms: Uniform[];
  /** CTPs da Meta para o personagem: o 1 (padrão) e o 2 (opcional); cada equipe Meta escolhe um por dia. */
  metaCtp1Id: string | null;
  metaCtp2Id: string | null;
  /** Modos em que pontua: automático (pelas equipes Meta em que é Causador de Dano) ou escolhidos pelo admin. */
  scoringAuto: boolean;
  scoringModes: Mode[];
  /** Modos das equipes Meta em que é Causador de Dano (a detecção automática). */
  detectedScoringModes: Mode[];
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
  /** CTP recomendado (o do slot escolhido, já resolvido). null = sem recomendação. */
  ctpId: string | null;
  /** Slot de CTP do personagem usado neste dia; null = equipe antiga, com CTP escolhido só para ela. */
  ctpSlot: 1 | 2 | null;
  /** Causador de Dano (qualquer posição): leva às rotações do personagem. */
  isDamageDealer: boolean;
  /** Striker meta (apoio da Transcendência 4) do Causador de Dano; null = não indicado. */
  strikerUniformId: string | null;
}

/** Rotação de um personagem, em texto livre. `uniformId` null = vale para todos os trajes. */
export interface Rotation {
  id: string;
  agentId: string;
  uniformId: string | null;
  /** Temporada (efeito do chefe) em que a rotação vale; null = todas. */
  effect: BossEffect | null;
  position: number;
  title: string | null;
  titleEn: string | null;
  /** Sequência em texto livre (a notação 1–6 / c / dc / qc vira "chips" quando reconhecida). */
  sequence: string;
  /** Quando usar, os delays, o que observar. */
  description: string | null;
  descriptionEn: string | null;
  /** Vídeo de referência (YouTube ou .mp4/.webm externo), para qualquer modo. */
  videoUrl: string | null;
  /** Demonstração da rotação em cada modo. */
  videoBax: string | null;
  videoBal: string | null;
  videoBai: string | null;
  updatedAt: string;
}

/** Temporada atual: efeito que atordoa o chefe em todos os dias de cada modo. */
export interface Season {
  BAX: BaxEffect;
  BAL: BalEffect;
}

export interface MetaTeam {
  id: string;
  scope: TeamScope;
  mode: DayMode | null;
  dayNumber: number | null;
  isPrimary: boolean;
  label: string | null;
  labelEn: string | null;
  notes: string | null;
  members: MetaTeamMember[];
  /** Ordem entre as alternativas do mesmo dia (a principal vem sempre primeiro). */
  position: number;
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
  nameEn: string | null;
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
  /** Login (com a senha). Contas são criadas por um Administrador. */
  username: string;
  nickname: string | null;
  role: Role;
}

/** Nome para exibir: apelido, senão o nome de usuário. */
export const displayName = (u: Pick<SessionUser, "nickname" | "username">) => u.nickname || u.username;

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
  /** Reservas cadastradas pela administração (além das equipes). */
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
  season: Season;
  days: CycleDay[];
  bai: { metaTeams: MetaTeam[]; bosses: BaiBoss[]; priority: PriorityLists; reserves: PriorityLists };
}
