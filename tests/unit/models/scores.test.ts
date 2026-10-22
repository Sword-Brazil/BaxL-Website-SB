import { describe, expect, it } from "vitest";
import { dailySeries, gameDayOf, modesOfDay, parsePoints, scoreSummary, weeklySeries } from "@/models/rules/scores";

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

const scores = {
  "2026-10-22|BAX": 100,
  "2026-10-22|BAL": 50,
  "2026-10-23|BAX": 120,
  "2026-10-24|BAI": 400,
  "2026-10-29|BAX": 90, // nova temporada, semana 1
};

describe("séries", () => {
  it("soma por dia e variação para o último dia preenchido", () => {
    const days = dailySeries(scores, ANCHOR, "2026-10-22", "2026-10-25");
    expect(days.map((d) => d.total)).toEqual([150, 120, 400, null]);
    expect(days.map((d) => d.delta)).toEqual([null, -30, 280, null]);
  });

  it("soma por semana de cada temporada, com ganho ou perda", () => {
    const weeks = weeklySeries(scores, ANCHOR);
    expect(weeks.map((w) => [w.seasonStart, w.week, w.total, w.days])).toEqual([
      ["2026-10-01", 4, 670, 3],
      ["2026-10-29", 1, 90, 1],
    ]);
    expect(weeks[1].delta).toBe(-580);
    expect(weeks[0].byMode).toEqual({ BAX: 220, BAL: 50, BAI: 400 });
  });

  it("cartões: hoje, semana, temporada e melhor dia", () => {
    expect(scoreSummary(scores, ANCHOR, "2026-10-24")).toMatchObject({
      today: 400,
      todayDelta: 280,
      week: 670,
      season: 670,
      seasonDays: 3,
      best: { date: "2026-10-24", total: 400 },
    });
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
