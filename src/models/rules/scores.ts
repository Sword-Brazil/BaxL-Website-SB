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

/** Variação em relação ao valor anterior (null sem anterior). */
const delta = (value: number | null, previous: number | null) => (value === null || previous === null ? null : value - previous);

export interface DailyPoint extends GameDay {
  BAX: number | null;
  BAL: number | null;
  BAI: number | null;
  /** Soma dos modos preenchidos no dia (null sem nenhum). */
  total: number | null;
  /** Ganho ou perda em relação ao último dia preenchido. */
  delta: number | null;
}

/** Um ponto por dia de `from` até `to`, com a soma do dia e a variação para o último dia preenchido. */
export function dailySeries(scores: Record<string, number>, anchorDate: string, from: string, to: string): DailyPoint[] {
  let previous: number | null = null;
  return dateRange(from, to).map((date) => {
    const day = gameDayOf(date, anchorDate);
    const value = (mode: ScoreMode) => scores[scoreKey(date, mode)] ?? null;
    const filled = SCORE_MODES.map(value).filter((v): v is number => v !== null);
    const total = filled.length ? filled.reduce((a, b) => a + b, 0) : null;
    const point = { ...day, BAX: value("BAX"), BAL: value("BAL"), BAI: value("BAI"), total, delta: delta(total, previous) };
    if (total !== null) previous = total;
    return point;
  });
}

export interface WeeklyPoint {
  seasonStart: string;
  week: number;
  /** Data do primeiro dia da semana. */
  start: string;
  total: number;
  byMode: Record<ScoreMode, number>;
  /** Dias com alguma pontuação. */
  days: number;
  average: number;
  /** Ganho ou perda em relação à semana anterior registrada. */
  delta: number | null;
}

/** Soma por semana do ciclo (de cada temporada), com a variação para a semana anterior. */
export function weeklySeries(scores: Record<string, number>, anchorDate: string): WeeklyPoint[] {
  const weeks = new Map<string, WeeklyPoint & { dates: Set<string> }>();
  for (const e of scoreEntries(scores, anchorDate)) {
    const key = `${e.seasonStart}#${e.week}`;
    const w = weeks.get(key) ?? {
      seasonStart: e.seasonStart,
      week: e.week,
      start: addDays(e.seasonStart, (e.week - 1) * WEEK_LENGTH),
      total: 0,
      byMode: { BAX: 0, BAL: 0, BAI: 0 },
      days: 0,
      average: 0,
      delta: null,
      dates: new Set<string>(),
    };
    w.total += e.points;
    w.byMode[e.mode] += e.points;
    w.dates.add(e.date);
    weeks.set(key, w);
  }
  let previous: number | null = null;
  return [...weeks.values()]
    .sort((a, b) => a.start.localeCompare(b.start))
    .map(({ dates, ...w }) => {
      const point = { ...w, days: dates.size, average: Math.round(w.total / dates.size), delta: delta(w.total, previous) };
      previous = w.total;
      return point;
    });
}

export interface ScoreSummary {
  today: number | null;
  todayDelta: number | null;
  week: number;
  weekDelta: number | null;
  season: number;
  seasonDays: number;
  best: { date: string; total: number } | null;
}

/** Números dos cartões: hoje, semana e temporada atuais e o melhor dia. */
export function scoreSummary(scores: Record<string, number>, anchorDate: string, today: string): ScoreSummary {
  const current = gameDayOf(today, anchorDate);
  const days = dailySeries(scores, anchorDate, SCORES_FIRST_DATE, today);
  const todayPoint = days.find((d) => d.date === today);
  const weeks = weeklySeries(scores, anchorDate);
  const week = weeks.find((w) => w.seasonStart === current.seasonStart && w.week === current.week);
  const seasonDays = days.filter((d) => d.seasonStart === current.seasonStart && d.total !== null);
  const best = days.reduce<{ date: string; total: number } | null>(
    (b, d) => (d.total !== null && (!b || d.total > b.total) ? { date: d.date, total: d.total } : b),
    null,
  );
  return {
    today: todayPoint?.total ?? null,
    todayDelta: todayPoint?.delta ?? null,
    week: week?.total ?? 0,
    weekDelta: week?.delta ?? null,
    season: seasonDays.reduce((n, d) => n + (d.total ?? 0), 0),
    seasonDays: seasonDays.length,
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
