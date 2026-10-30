// Pontuações do próprio jogador na Batalha de Aliança, por dia de jogo e modo. Ficam no documento
// de seleções (aparelho e conta). A chave é a data em Brasília em que o dia de jogo começa (12h) e
// o modo: "2026-10-22|BAX". Dia do ciclo, semana e temporada (ciclo de 28 dias) saem da âncora do
// ciclo nas configurações, então a contagem continua certa ciclo após ciclo.
//
// Dia do reset (Dias 1, 8, 15 e 22, quinta): o dia de jogo vai das 12h às 12h, mas o reset semanal
// é às 22h. O que se joga antes das 22h conta para a semana que acaba ("|pre" na chave); depois, a
// pontuação recomeça e conta para a semana nova (chave sem sufixo, como nos outros dias).
//
// BA normal: obrigatória antes da BAX, tem pontuação fixa por dia (não existe nos dias de BAI). Não é
// digitada: entra sozinha no total assim que a BAX ou a BAL é anotada, e no dia do reset conta antes
// e depois das 22h.
import { CYCLE_LENGTH, WEEK_LENGTH, isBaiDay } from "@/models/domain/enums";

export type ScoreMode = "BAX" | "BAL" | "BAI";

/** Pontos da BA normal, alternando nos dias de BAX/BAL de cada semana (a BAI fica de fora). */
export const NORMAL_BA_POINTS = [166_750, 210_500] as const;
export const SCORE_MODES = ["BAX", "BAL", "BAI"] as const satisfies readonly ScoreMode[];

/** A tela libera no reset semanal de 22/10/2026 às 22h (Brasília): a contagem começa limpa ali. */
export const SCORES_UNLOCK_AT = "2026-10-23T01:00:00.000Z";
/** Primeiro dia de jogo aceito: o Dia 22 do ciclo (1º dia da semana que começa nesse reset). */
export const SCORES_FIRST_DATE = "2026-10-22";

export const MAX_SCORE = 2_000_000_000;
export const SCORE_KEY_RE = /^(\d{4}-\d{2}-\d{2})\|(BAX|BAL|BAI)(\|pre)?$/;

/** Parte do dia: "pre" = antes do reset das 22h no dia do reset (conta na semana anterior); "post" = o resto. */
export type ScorePhase = "pre" | "post";

export const scoreKey = (date: string, mode: ScoreMode, phase: ScorePhase = "post") =>
  `${date}|${mode}${phase === "pre" ? "|pre" : ""}`;

export function parseScoreKey(key: string): { date: string; mode: ScoreMode; phase: ScorePhase } | null {
  const m = SCORE_KEY_RE.exec(key);
  return m ? { date: m[1], mode: m[2] as ScoreMode, phase: m[3] ? "pre" : "post" } : null;
}

const DAY_MS = 86_400_000;
const toUtc = (date: string) => Date.parse(`${date}T00:00:00Z`);
const mod = (n: number, m: number) => ((n % m) + m) % m;

export const addDays = (date: string, n: number) => new Date(toUtc(date) + n * DAY_MS).toISOString().slice(0, 10);
export const diffDays = (a: string, b: string) => Math.round((toUtc(a) - toUtc(b)) / DAY_MS);

/** Lista de datas de `from` até `to` (inclusive), em ordem. */
export function dateRange(from: string, to: string): string[] {
  const n = diffDays(to, from);
  return n < 0 ? [] : Array.from({ length: n + 1 }, (_, i) => addDays(from, i));
}

export interface GameDay {
  date: string;
  /** Dia do ciclo (1–28). */
  cycleDay: number;
  /** Semana do ciclo (1–4). */
  week: number;
  /** Data do Dia 1 da temporada (ciclo de 28 dias) a que o dia pertence. */
  seasonStart: string;
  isBai: boolean;
}

/** Dia do ciclo, semana e temporada de uma data, a partir da data do Dia 1 de algum ciclo. */
export function gameDayOf(date: string, anchorDate: string): GameDay {
  const index = mod(diffDays(date, anchorDate), CYCLE_LENGTH);
  const cycleDay = index + 1;
  return {
    date,
    cycleDay,
    week: Math.floor(index / WEEK_LENGTH) + 1,
    seasonStart: addDays(date, -index),
    isBai: isBaiDay(cycleDay),
  };
}

/** Modos jogados no dia: BAX e BAL, ou só a BAI no 3º dia de cada semana. */
export const modesOfDay = (day: GameDay): ScoreMode[] => (day.isBai ? ["BAI"] : ["BAX", "BAL"]);

/** Dia do reset semanal (1º dia de cada semana do ciclo): tem a parte antes e a depois das 22h. */
export const isResetDay = (day: GameDay) => (day.cycleDay - 1) % WEEK_LENGTH === 0;

/**
 * Pontos da BA normal de um dia do ciclo: nos dias de BAX/BAL da semana (1, 2, 4, 5, 6 e 7) alterna
 * 166.750 e 210.500, começando a cada semana pelo menor. null nos dias de BAI.
 */
export function normalBaPointsOf(cycleDay: number): number | null {
  if (isBaiDay(cycleDay)) return null;
  const weekDays = Array.from({ length: WEEK_LENGTH }, (_, i) => i + 1).filter((n) => !isBaiDay(n));
  const index = weekDays.indexOf(((cycleDay - 1) % WEEK_LENGTH) + 1);
  return NORMAL_BA_POINTS[index % NORMAL_BA_POINTS.length];
}

/**
 * BA normal de uma parte do dia: conta quando a BAX ou a BAL dela foi anotada. No dia do reset ela é
 * refeita depois das 22h, então conta nas duas partes.
 */
export function normalBaOf(scores: Record<string, number>, date: string, phase: ScorePhase, anchorDate: string): number | null {
  const played = (["BAX", "BAL"] as const).some((m) => scores[scoreKey(date, m, phase)] !== undefined);
  return played ? normalBaPointsOf(gameDayOf(date, anchorDate).cycleDay) : null;
}

/** Partes do dia que dá para preencher: no dia do reset, antes e depois das 22h (a de antes não existe no 1º dia contado). */
export const phasesOfDay = (day: GameDay, firstDate = SCORES_FIRST_DATE): ScorePhase[] =>
  isResetDay(day) && day.date > firstDate ? ["pre", "post"] : ["post"];

export interface ScoreEntry extends GameDay {
  mode: ScoreMode;
  phase: ScorePhase;
  points: number;
}

/**
 * Pontuações registradas, em ordem (data, fase e modo). A parte antes do reset fica com a semana e
 * a temporada do dia anterior, para onde ela conta.
 */
export function scoreEntries(scores: Record<string, number>, anchorDate: string): ScoreEntry[] {
  return Object.entries(scores)
    .flatMap(([key, points]) => {
      const k = parseScoreKey(key);
      if (!k) return [];
      const counted = gameDayOf(k.phase === "pre" ? addDays(k.date, -1) : k.date, anchorDate);
      const day = gameDayOf(k.date, anchorDate);
      return [{ ...day, week: counted.week, seasonStart: counted.seasonStart, mode: k.mode, phase: k.phase, points }];
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.phase === b.phase ? 0 : a.phase === "pre" ? -1 : 1) ||
        SCORE_MODES.indexOf(a.mode) - SCORE_MODES.indexOf(b.mode),
    );
}

/**
 * A BA reinicia a cada 28 dias: cada dia (e cada semana) é comparado com o mesmo dia (e a mesma
 * semana) da temporada anterior, 28 dias antes.
 */
export interface Comparison {
  current: number | null;
  /** O mesmo período na temporada anterior. */
  previous: number | null;
  /** Diferença (positiva = cresceu). */
  delta: number | null;
  /** Crescimento em fração (0.1 = +10%); null sem base de comparação. */
  pct: number | null;
}

export function compare(current: number | null, previous: number | null): Comparison {
  const delta = current === null || previous === null ? null : current - previous;
  return { current, previous, delta, pct: delta === null || !previous ? null : delta / previous };
}

const sumOf = (values: (number | undefined)[]) => {
  const filled = values.filter((v): v is number => v !== undefined);
  return filled.length ? filled.reduce((a, b) => a + b, 0) : null;
};

/** Pontos de uma parte do dia (soma dos modos e da BA normal; null sem nenhum). */
const phaseTotal = (scores: Record<string, number>, date: string, phase: ScorePhase, anchorDate: string) =>
  sumOf([...SCORE_MODES.map((m) => scores[scoreKey(date, m, phase)]), normalBaOf(scores, date, phase, anchorDate) ?? undefined]);

/** Soma do dia de jogo inteiro (no dia do reset, antes e depois das 22h); null sem nenhum valor. */
export function dayTotal(scores: Record<string, number>, date: string, anchorDate: string): number | null {
  return sumOf([phaseTotal(scores, date, "pre", anchorDate) ?? undefined, phaseTotal(scores, date, "post", anchorDate) ?? undefined]);
}

/**
 * Soma de um período que começa num dia de reset (semana ou temporada), de `from` a `to`: a parte
 * antes do reset de `from` é do período anterior e fica de fora; a do reset seguinte (`to` + 1)
 * entra quando `withNextReset` (período já fechado). null se nada estiver preenchido.
 */
export function sumPeriod(
  scores: Record<string, number>,
  anchorDate: string,
  from: string,
  to: string,
  withNextReset = false,
): number | null {
  const parts = dateRange(from, to).flatMap((d) => [
    phaseTotal(scores, d, "post", anchorDate),
    d === from ? null : phaseTotal(scores, d, "pre", anchorDate),
  ]);
  if (withNextReset) parts.push(phaseTotal(scores, addDays(to, 1), "pre", anchorDate));
  return sumOf(parts.map((v) => v ?? undefined));
}

/** Mesma data na temporada anterior. */
export const previousSeasonDate = (date: string) => addDays(date, -CYCLE_LENGTH);

export interface SeasonDay extends GameDay, Comparison {
  BAX: number | null;
  BAL: number | null;
  BAI: number | null;
  /** BA normal somada com a BAX do dia. */
  normal: number | null;
  /** Dia que ainda não chegou. */
  future: boolean;
}

/** Os 28 dias de uma temporada, cada um comparado com o mesmo dia da temporada anterior. */
export function seasonDays(scores: Record<string, number>, anchorDate: string, seasonStart: string, today: string): SeasonDay[] {
  return Array.from({ length: CYCLE_LENGTH }, (_, i) => {
    const date = addDays(seasonStart, i);
    const future = date > today;
    const value = (mode: ScoreMode) => (future ? null : (scores[scoreKey(date, mode)] ?? null));
    return {
      ...gameDayOf(date, anchorDate),
      BAX: value("BAX"),
      BAL: value("BAL"),
      BAI: value("BAI"),
      normal: future ? null : sumOf([normalBaOf(scores, date, "pre", anchorDate) ?? undefined, normalBaOf(scores, date, "post", anchorDate) ?? undefined]),
      future,
      ...compare(future ? null : dayTotal(scores, date, anchorDate), dayTotal(scores, previousSeasonDate(date), anchorDate)),
    };
  });
}

export interface SeasonWeek extends Comparison {
  week: number;
  /** Primeiro dia da semana. */
  start: string;
  /** Semana em andamento: compara com a anterior só até o mesmo dia da semana. */
  partial: boolean;
  future: boolean;
}

/** As 4 semanas de uma temporada, cada uma comparada com a mesma semana da temporada anterior. */
export function seasonWeeks(scores: Record<string, number>, anchorDate: string, seasonStart: string, today: string): SeasonWeek[] {
  return Array.from({ length: CYCLE_LENGTH / WEEK_LENGTH }, (_, i) => {
    const start = addDays(seasonStart, i * WEEK_LENGTH);
    const end = addDays(start, WEEK_LENGTH - 1);
    const future = start > today;
    const partial = !future && today < end;
    const to = partial ? today : end;
    // A parte antes do próximo reset (até 22h da quinta seguinte) fecha a semana.
    const closed = addDays(end, 1) <= today;
    return {
      week: i + 1,
      start,
      partial,
      future,
      ...compare(
        future ? null : sumPeriod(scores, anchorDate, start, to, closed),
        sumPeriod(scores, anchorDate, previousSeasonDate(start), previousSeasonDate(future ? end : to), future || closed),
      ),
    };
  });
}

/** Temporadas (data do Dia 1) com alguma pontuação, mais a atual, da mais recente para a mais antiga. */
export function seasonsWithScores(scores: Record<string, number>, anchorDate: string, today: string): string[] {
  const starts = new Set([gameDayOf(today, anchorDate).seasonStart]);
  for (const e of scoreEntries(scores, anchorDate)) starts.add(e.seasonStart);
  return [...starts].sort().reverse();
}

export interface ScoreSummary {
  /** Hoje (no dia do reset, só a parte antes ou depois das 22h) contra o mesmo dia da temporada anterior. */
  today: Comparison;
  /** Semana atual (até hoje) contra a mesma semana da temporada anterior até o mesmo dia. */
  week: Comparison;
  /** Temporada atual (até hoje) contra a anterior até o mesmo dia. */
  season: Comparison;
  /**
   * Semana e temporada que os cartões mostram. No dia do reset, antes das 22h, ainda são as que
   * estão acabando (a pontuação desse horário conta para elas).
   */
  counted: { week: number; seasonStart: string };
  /** Total da semana fechada antes da semana dos cartões (null sem pontuação nela). */
  lastWeek: number | null;
  seasonDays: number;
  best: { date: string; total: number } | null;
}

/**
 * Números dos cartões: hoje, semana e temporada atuais (contra o mês anterior) e o melhor dia.
 * `beforeReset`: agora é antes do reset das 22h do dia do reset, então semana e temporada são as que
 * acabam — até ontem, mais a parte de hoje antes do reset.
 */
export function scoreSummary(scores: Record<string, number>, anchorDate: string, today: string, beforeReset = false): ScoreSummary {
  const closing = beforeReset && isResetDay(gameDayOf(today, anchorDate));
  const until = closing ? addDays(today, -1) : today;
  const current = gameDayOf(until, anchorDate);
  const weekStart = addDays(current.seasonStart, (current.week - 1) * WEEK_LENGTH);
  const period = (from: string) =>
    compare(
      sumPeriod(scores, anchorDate, from, until, closing),
      sumPeriod(scores, anchorDate, previousSeasonDate(from), previousSeasonDate(until), closing),
    );
  const dates = [...new Set(scoreEntries(scores, anchorDate).map((e) => e.date))];
  const best = dates.reduce<{ date: string; total: number } | null>((b, d) => {
    const t = dayTotal(scores, d, anchorDate) ?? 0;
    return !b || t > b.total ? { date: d, total: t } : b;
  }, null);
  // No dia do reset a pontuação do dia zera às 22h: o cartão de hoje mostra só a parte que vale agora.
  const phase: ScorePhase = closing ? "pre" : "post";
  return {
    today: compare(phaseTotal(scores, today, phase, anchorDate), phaseTotal(scores, previousSeasonDate(today), phase, anchorDate)),
    week: period(weekStart),
    season: period(current.seasonStart),
    counted: { week: current.week, seasonStart: current.seasonStart },
    lastWeek: sumPeriod(scores, anchorDate, addDays(weekStart, -WEEK_LENGTH), addDays(weekStart, -1), true),
    seasonDays: dateRange(current.seasonStart, today).filter((d) => dayTotal(scores, d, anchorDate) !== null).length,
    best,
  };
}

/**
 * Total da temporada (soma das semanas) contra a anterior. As semanas que ainda não chegaram ficam
 * de fora dos dois lados, para a temporada em andamento comparar só até hoje.
 */
export function seasonTotal(weeks: SeasonWeek[]): Comparison {
  const started = weeks.filter((w) => !w.future);
  return compare(sumOf(started.map((w) => w.current ?? undefined)), sumOf(started.map((w) => w.previous ?? undefined)));
}

/** Lê o número digitado ("1.234.567", "1 234 567"); null se vazio ou inválido. */
export function parsePoints(input: string): number | null {
  const digits = input.replace(/[\s.,_]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const n = Number(digits);
  return n <= MAX_SCORE ? n : null;
}
