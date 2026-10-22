import { describe, expect, it } from "vitest";
import {
  compare,
  dayTotal,
  gameDayOf,
  modesOfDay,
  parsePoints,
  phasesOfDay,
  scoreEntries,
  scoreKey,
  scoreSummary,
  seasonDays,
  seasonWeeks,
  seasonsWithScores,
} from "@/models/rules/scores";

const ANCHOR = "2026-10-01"; // Dia 1 de um ciclo

describe("gameDayOf", () => {
  it("dia do ciclo, semana e temporada a partir da âncora", () => {
    expect(gameDayOf("2026-10-22", ANCHOR)).toMatchObject({ cycleDay: 22, week: 4, seasonStart: "2026-10-01", isBai: false });
    expect(gameDayOf("2026-10-24", ANCHOR)).toMatchObject({ cycleDay: 24, isBai: true });
    // Ciclo seguinte: volta ao Dia 1 numa nova temporada.
    expect(gameDayOf("2026-10-29", ANCHOR)).toMatchObject({ cycleDay: 1, week: 1, seasonStart: "2026-10-29" });
    expect(modesOfDay(gameDayOf("2026-10-24", ANCHOR))).toEqual(["BAI"]);
    expect(modesOfDay(gameDayOf("2026-10-25", ANCHOR))).toEqual(["BAX", "BAL"]);
  });
});

// Temporada anterior (Dia 1 = 03/09) e atual (Dia 1 = 01/10): o Dia 22 é 24/09 e 22/10.
const scores = {
  "2026-09-24|BAX": 100,
  "2026-09-24|BAL": 100,
  "2026-09-25|BAX": 200,
  "2026-09-26|BAI": 1000,
  "2026-10-22|BAX": 150,
  "2026-10-22|BAL": 90,
  "2026-10-23|BAX": 150,
  "2026-10-24|BAI": 900,
};

describe("comparação com a temporada anterior (mesmo dia do ciclo, 28 dias antes)", () => {
  it("cada dia da temporada contra o mesmo dia da anterior, com diferença e %", () => {
    const days = seasonDays(scores, ANCHOR, "2026-10-01", "2026-10-24");
    expect(days).toHaveLength(28);
    const d22 = days[21];
    expect(d22).toMatchObject({ cycleDay: 22, current: 240, previous: 200, delta: 40 });
    expect(d22.pct).toBeCloseTo(0.2);
    expect(days[22]).toMatchObject({ cycleDay: 23, current: 150, previous: 200, delta: -50, pct: -0.25 });
    expect(days[23]).toMatchObject({ cycleDay: 24, current: 900, previous: 1000, delta: -100 });
    // Dia que ainda não chegou: só o valor da temporada anterior.
    expect(days[24]).toMatchObject({ cycleDay: 25, future: true, current: null, delta: null });
    expect(compare(10, 0).pct).toBeNull();
  });

  it("semanas: a em andamento compara com a anterior só até o mesmo dia", () => {
    const weeks = seasonWeeks(scores, "2026-10-01", "2026-10-23");
    // Semana 4 até o Dia 23 (22–23) contra 24–25/09: 390 contra 400.
    expect(weeks[3]).toMatchObject({ week: 4, partial: true, current: 390, previous: 400, delta: -10 });
    expect(weeks[0]).toMatchObject({ week: 1, partial: false, current: null, previous: null });
  });

  it("cartões: hoje, semana e temporada contra o mês anterior, e o melhor dia", () => {
    const s = scoreSummary(scores, ANCHOR, "2026-10-24");
    expect(s.today).toMatchObject({ current: 900, previous: 1000, delta: -100, pct: -0.1 });
    expect(s.week).toMatchObject({ current: 1290, previous: 1400, delta: -110 });
    expect(s.season).toMatchObject({ current: 1290, previous: 1400 });
    expect(s.seasonDays).toBe(3);
    expect(s.best).toEqual({ date: "2026-09-26", total: 1000 });
  });

  it("temporadas com pontuação, da mais recente para a mais antiga", () => {
    expect(seasonsWithScores(scores, ANCHOR, "2026-10-24")).toEqual(["2026-10-01", "2026-09-03"]);
  });
});

describe("dia do reset (antes e depois das 22h)", () => {
  // Dia 15 (15/10) é dia de reset: antes das 22h conta na Semana 2; depois, na Semana 3.
  const r = {
    [scoreKey("2026-10-14", "BAX")]: 100, // Dia 14, Semana 2
    [scoreKey("2026-10-15", "BAX", "pre")]: 30, // Dia 15 antes do reset → Semana 2
    [scoreKey("2026-10-15", "BAX")]: 50, // Dia 15 depois do reset → Semana 3
    [scoreKey("2026-10-16", "BAX")]: 70,
  };

  it("só o dia do reset tem as duas partes (e não no 1º dia contado)", () => {
    const first = "2026-10-22";
    expect(phasesOfDay(gameDayOf("2026-10-29", ANCHOR), first)).toEqual(["pre", "post"]);
    expect(phasesOfDay(gameDayOf("2026-10-23", ANCHOR), first)).toEqual(["post"]);
    expect(phasesOfDay(gameDayOf("2026-10-22", ANCHOR), first)).toEqual(["post"]); // Dia 22: a contagem começa às 22h
  });

  it("a parte antes do reset conta na semana anterior; o dia soma as duas partes", () => {
    const weeks = seasonWeeks(r, "2026-10-01", "2026-10-21");
    expect(weeks[1]).toMatchObject({ week: 2, current: 130 }); // 100 + 30 (fechada: o reset seguinte já passou)
    expect(weeks[2]).toMatchObject({ week: 3, current: 120 }); // 50 + 70
    expect(dayTotal(r, "2026-10-15")).toBe(80);
    const pre = scoreEntries(r, ANCHOR).find((e) => e.phase === "pre")!;
    expect(pre).toMatchObject({ cycleDay: 15, week: 2 });
  });

  it("a semana atual, no dia do reset, começa só com o que veio depois das 22h", () => {
    expect(scoreSummary(r, ANCHOR, "2026-10-15").week.current).toBe(50);
  });

  it("a parte antes do reset do Dia 1 é da temporada anterior", () => {
    const e = scoreEntries({ [scoreKey("2026-10-29", "BAL", "pre")]: 10 }, ANCHOR)[0];
    expect(e).toMatchObject({ cycleDay: 1, week: 4, seasonStart: "2026-10-01" });
  });
});

describe("parsePoints", () => {
  it("aceita separadores de milhar e recusa texto", () => {
    expect(parsePoints("1.234.567")).toBe(1234567);
    expect(parsePoints(" 12 000 ")).toBe(12000);
    expect(parsePoints("")).toBeNull();
    expect(parsePoints("12a")).toBeNull();
  });
});
