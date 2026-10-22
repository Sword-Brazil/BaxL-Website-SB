// Pontuações do próprio jogador na Batalha de Aliança, por dia de jogo e modo. Ficam no documento
// de seleções (aparelho e conta). A chave é a data em Brasília em que o dia de jogo começa (12h) e
// o modo: "2026-10-22|BAX". Dia do ciclo, semana e temporada (ciclo de 28 dias) saem da âncora do
// ciclo nas configurações, então a contagem continua certa ciclo após ciclo.
import { CYCLE_LENGTH, WEEK_LENGTH, isBaiDay } from "@/models/domain/enums";

export type ScoreMode = "BAX" | "BAL" | "BAI";
export const SCORE_MODES = ["BAX", "BAL", "BAI"] as const satisfies readonly ScoreMode[];

/** A tela libera no reset semanal de 22/10/2026 às 22h (Brasília): a contagem começa limpa ali. */
export const SCORES_UNLOCK_AT = "2026-10-23T01:00:00.000Z";
/** Primeiro dia de jogo aceito: o Dia 22 do ciclo (1º dia da semana que começa nesse reset). */
export const SCORES_FIRST_DATE = "2026-10-22";

export const MAX_SCORE = 2_000_000_000;
export const SCORE_KEY_RE = /^(\d{4}-\d{2}-\d{2})\|(BAX|BAL|BAI)$/;

export const scoreKey = (date: string, mode: ScoreMode) => `${date}|${mode}`;

export function parseScoreKey(key: string): { date: string; mode: ScoreMode } | null {
  const m = SCORE_KEY_RE.exec(key);
  return m ? { date: m[1], mode: m[2] as ScoreMode } : null;
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

export interface ScoreEntry extends GameDay {
  mode: ScoreMode;
  points: number;
}

/** Pontuações registradas, em ordem (data e modo). */
export function scoreEntries(scores: Record<string, number>, anchorDate: string): ScoreEntry[] {
  return Object.entries(scores)
    .flatMap(([key, points]) => {
      const k = parseScoreKey(key);
      return k ? [{ ...gameDayOf(k.date, anchorDate), mode: k.mode, points }] : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date) || SCORE_MODES.indexOf(a.mode) - SCORE_MODES.indexOf(b.mode));
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

/** Soma dos modos preenchidos no dia (null sem nenhum). */
export function dayTotal(scores: Record<string, number>, date: string): number | null {
  const filled = SCORE_MODES.flatMap((m) => {
    const v = scores[scoreKey(date, m)];
    return v === undefined ? [] : [v];
  });
  return filled.length ? filled.reduce((a, b) => a + b, 0) : null;
}

/** Soma dos dias preenchidos de `from` a `to` (null se nenhum dia tiver pontuação). */
export function sumRange(scores: Record<string, number>, from: string, to: string): number | null {
  const totals = dateRange(from, to).flatMap((d) => {
    const t = dayTotal(scores, d);
    return t === null ? [] : [t];
  });
  return totals.length ? totals.reduce((a, b) => a + b, 0) : null;
}

/** Mesma data na temporada anterior. */
export const previousSeasonDate = (date: string) => addDays(date, -CYCLE_LENGTH);

export interface SeasonDay extends GameDay, Comparison {
  BAX: number | null;
  BAL: number | null;
  BAI: number | null;
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
      future,
      ...compare(future ? null : dayTotal(scores, date), dayTotal(scores, previousSeasonDate(date))),
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
export function seasonWeeks(scores: Record<string, number>, seasonStart: string, today: string): SeasonWeek[] {
  return Array.from({ length: CYCLE_LENGTH / WEEK_LENGTH }, (_, i) => {
    const start = addDays(seasonStart, i * WEEK_LENGTH);
    const end = addDays(start, WEEK_LENGTH - 1);
    const future = start > today;
    const partial = !future && today < end;
    const to = partial ? today : end;
    return {
      week: i + 1,
      start,
      partial,
      future,
      ...compare(
        future ? null : sumRange(scores, start, to),
        sumRange(scores, previousSeasonDate(start), previousSeasonDate(future ? end : to)),
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
  /** Hoje contra o mesmo dia da temporada anterior. */
  today: Comparison;
  /** Semana atual (até hoje) contra a mesma semana da temporada anterior até o mesmo dia. */
  week: Comparison;
  /** Temporada atual (até hoje) contra a anterior até o mesmo dia. */
  season: Comparison;
  seasonDays: number;
  best: { date: string; total: number } | null;
}

/** Números dos cartões: hoje, semana e temporada atuais (contra o mês anterior) e o melhor dia. */
export function scoreSummary(scores: Record<string, number>, anchorDate: string, today: string): ScoreSummary {
  const current = gameDayOf(today, anchorDate);
  const weekStart = addDays(current.seasonStart, (current.week - 1) * WEEK_LENGTH);
  const period = (from: string) =>
    compare(sumRange(scores, from, today), sumRange(scores, previousSeasonDate(from), previousSeasonDate(today)));
  const dates = [...new Set(scoreEntries(scores, anchorDate).map((e) => e.date))];
  const best = dates.reduce<{ date: string; total: number } | null>((b, d) => {
    const t = dayTotal(scores, d) ?? 0;
    return !b || t > b.total ? { date: d, total: t } : b;
  }, null);
  return {
    today: compare(dayTotal(scores, today), dayTotal(scores, previousSeasonDate(today))),
    week: period(weekStart),
    season: period(current.seasonStart),
    seasonDays: dateRange(current.seasonStart, today).filter((d) => dayTotal(scores, d) !== null).length,
    best,
  };
}

/** Lê o número digitado ("1.234.567", "1 234 567"); null se vazio ou inválido. */
export function parsePoints(input: string): number | null {
  const digits = input.replace(/[\s.,_]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const n = Number(digits);
  return n <= MAX_SCORE ? n : null;
}
