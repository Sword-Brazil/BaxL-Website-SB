import { CYCLE_LENGTH, WEEK_LENGTH, isBaiDay, weekdayOf } from "@/models/domain/enums";
import type { BattleClock, Settings } from "@/models/domain/types";

export const BRT_TIME_ZONE = "America/Sao_Paulo";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const WEEKS_PER_CYCLE = CYCLE_LENGTH / WEEK_LENGTH;

const brtParts = new Intl.DateTimeFormat("en-US", {
  timeZone: BRT_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Converte um instante no "relógio de parede" de Brasília, representado como ms UTC. */
function toBrtWall(instant: number): number {
  const p = Object.fromEntries(brtParts.formatToParts(new Date(instant)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) + (instant % 1000);
}

/** Converte um horário de parede de Brasília (ms UTC fictício) de volta para o instante real. */
function fromBrtWall(wall: number): number {
  const offset = toBrtWall(wall) - wall; // aproximação inicial (offset no instante "wall")
  const guess = wall - offset;
  return wall - (toBrtWall(guess) - guess);
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

const brtDate = new Intl.DateTimeFormat("en-CA", { timeZone: BRT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** Data (AAAA-MM-DD) no horário de Brasília de um instante. */
export const brtDateKey = (instant: string | Date) => brtDate.format(new Date(instant));

/**
 * Calcula o dia de batalha atual a partir do horário de Brasília.
 * - O dia vira em `dayTurnoverHour` (12:00): é a única hora em que `cycleDay` muda.
 * - O reset semanal ocorre na quinta-feira às `weeklyResetHour` (22:00), ou seja, no primeiro dia
 *   de cada semana do ciclo (Dias 1, 8, 15 e 22: quinta 12:00 → sexta 12:00), e muda apenas
 *   `weekIndex` (a semana para a qual a pontuação conta): até 21:59 ainda vale a semana anterior.
 */
export function getBattleClock(now: Date, settings: Settings): BattleClock {
  const nowMs = now.getTime();
  const nowWall = toBrtWall(nowMs);

  // Âncora normalizada para o horário de virada, na data (BRT) do Dia 1.
  const anchorWallRaw = toBrtWall(Date.parse(settings.cycleAnchor));
  const anchorWall = Math.floor(anchorWallRaw / DAY) * DAY + settings.dayTurnoverHour * HOUR;

  const elapsedDays = Math.floor((nowWall - anchorWall) / DAY);
  const cycleIndex = mod(elapsedDays, CYCLE_LENGTH);
  const cycleDay = cycleIndex + 1;
  const dayStartWall = anchorWall + elapsedDays * DAY;

  const isResetDay = cycleIndex % WEEK_LENGTH === 0;
  const resetOffset = mod(settings.weeklyResetHour - settings.dayTurnoverHour, 24) * HOUR;
  const beforeWeeklyReset = isResetDay && nowWall < dayStartWall + resetOffset;

  const baseWeek = Math.floor(cycleIndex / WEEK_LENGTH);
  const weekIndex = beforeWeeklyReset ? mod(baseWeek - 1, WEEKS_PER_CYCLE) : baseWeek;

  let daysToBai = 0;
  while (!isBaiDay(mod(cycleIndex + daysToBai, CYCLE_LENGTH) + 1)) daysToBai++;

  return {
    cycleDay,
    weekIndex,
    mode: isBaiDay(cycleDay) ? "BAI" : "BAX_BAL",
    weekday: weekdayOf(cycleDay),
    isResetDay,
    beforeWeeklyReset,
    dayStart: new Date(fromBrtWall(dayStartWall)).toISOString(),
    nextDayStart: new Date(fromBrtWall(dayStartWall + DAY)).toISOString(),
    nextBaiStart: new Date(fromBrtWall(dayStartWall + daysToBai * DAY)).toISOString(),
    now: now.toISOString(),
  };
}
