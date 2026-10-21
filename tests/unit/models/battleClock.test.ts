import { afterEach, describe, expect, it } from "vitest";
import { getBattleClock } from "@/models/rules/battleClock";
import type { Settings } from "@/models/domain/types";

// Dia 1 começa na quinta-feira 2026-10-15 às 12:00 BRT (15:00 UTC).
const settings: Settings = {
  cycleAnchor: "2026-10-15T15:00:00.000Z",
  dayTurnoverHour: 12,
  weeklyResetHour: 22,
  baiWeekday: 3,
};

/** Instante a partir de data/hora no horário de Brasília (UTC-3). */
const brt = (date: string, time: string) => new Date(`${date}T${time}:00-03:00`);

describe("getBattleClock", () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it("ciclo real (seed): Dia 1 em 01/10/2026 → o Dia 19 (segunda) começa em 19/10/2026 às 12:00 BRT", () => {
    const real = { ...settings, cycleAnchor: "2026-10-01T15:00:00.000Z" };
    expect(getBattleClock(brt("2026-10-19", "11:59"), real).cycleDay).toBe(18);
    const c = getBattleClock(brt("2026-10-19", "12:00"), real);
    expect(c.cycleDay).toBe(19);
    expect(c.weekday).toBe("SEG");
  });

  it("começa o Dia 1 (quinta) às 12:00 BRT, ainda antes do reset das 22:00", () => {
    const c = getBattleClock(brt("2026-10-15", "12:00"), settings);
    expect(c.cycleDay).toBe(1);
    expect(c.weekday).toBe("QUI");
    expect(c.weekIndex).toBe(3); // até o reset, a pontuação é da última semana do ciclo anterior
    expect(c.mode).toBe("BAX_BAL");
  });

  it("às 11:59 ainda é o dia anterior; às 12:00 avança", () => {
    expect(getBattleClock(brt("2026-10-16", "11:59"), settings).cycleDay).toBe(1);
    expect(getBattleClock(brt("2026-10-16", "12:00"), settings).cycleDay).toBe(2);
  });

  it("antes da âncora conta para trás no ciclo (dia 28)", () => {
    expect(getBattleClock(brt("2026-10-15", "11:59"), settings).cycleDay).toBe(28);
  });

  it("dias 3, 10, 17 e 24 são de BAI", () => {
    const bai = [3, 10, 17, 24].map(
      (d) => getBattleClock(new Date(Date.parse(settings.cycleAnchor) + (d - 1) * 864e5 + 60_000), settings),
    );
    expect(bai.map((c) => [c.cycleDay, c.mode])).toEqual([
      [3, "BAI"],
      [10, "BAI"],
      [17, "BAI"],
      [24, "BAI"],
    ]);
    expect(getBattleClock(brt("2026-10-18", "13:00"), settings).mode).toBe("BAX_BAL");
  });

  describe("reset semanal: quinta-feira às 22:00 (Dia 8: quinta 12:00 → sexta 12:00)", () => {
    it("quarta (Dia 7) não é dia de reset", () => {
      const c = getBattleClock(brt("2026-10-21", "22:30"), settings);
      expect(c.cycleDay).toBe(7);
      expect(c.weekday).toBe("QUA");
      expect(c.isResetDay).toBe(false);
      expect(c.weekIndex).toBe(0);
    });

    it("quinta às 21:59 ainda conta para a semana anterior", () => {
      const c = getBattleClock(brt("2026-10-22", "21:59"), settings);
      expect(c.cycleDay).toBe(8);
      expect(c.weekday).toBe("QUI");
      expect(c.isResetDay).toBe(true);
      expect(c.beforeWeeklyReset).toBe(true);
      expect(c.weekIndex).toBe(0);
    });

    it("quinta às 22:00 a semana avança, mas o número do dia NÃO muda", () => {
      const c = getBattleClock(brt("2026-10-22", "22:00"), settings);
      expect(c.cycleDay).toBe(8);
      expect(c.isResetDay).toBe(true);
      expect(c.beforeWeeklyReset).toBe(false);
      expect(c.weekIndex).toBe(1);
    });

    it("o número do dia só avança às 12:00 seguintes, e a sexta não é dia de reset", () => {
      expect(getBattleClock(brt("2026-10-23", "11:59"), settings).cycleDay).toBe(8);
      const c = getBattleClock(brt("2026-10-23", "12:00"), settings);
      expect(c.cycleDay).toBe(9);
      expect(c.weekIndex).toBe(1);
      expect(c.isResetDay).toBe(false);
    });
  });

  it("o ciclo dá a volta: dia 28 → dia 1, e a semana 3 → 0 só no reset de quinta", () => {
    const d28 = getBattleClock(brt("2026-11-11", "22:30"), settings);
    expect(d28.cycleDay).toBe(28);
    expect(d28.weekIndex).toBe(3);
    const d1 = getBattleClock(brt("2026-11-12", "12:00"), settings);
    expect(d1.cycleDay).toBe(1);
    expect(d1.weekIndex).toBe(3);
    expect(getBattleClock(brt("2026-11-12", "22:00"), settings).weekIndex).toBe(0);
  });

  it("calcula nextBaiStart e dayStart", () => {
    const c = getBattleClock(brt("2026-10-16", "15:00"), settings); // Dia 2
    expect(c.nextBaiStart).toBe(brt("2026-10-17", "12:00").toISOString());
    expect(c.dayStart).toBe(brt("2026-10-16", "12:00").toISOString());
    expect(c.nextDayStart).toBe(brt("2026-10-17", "12:00").toISOString());

    const today = getBattleClock(brt("2026-10-17", "20:00"), settings); // Dia 3 (BAI)
    expect(today.nextBaiStart).toBe(brt("2026-10-17", "12:00").toISOString());

    const after = getBattleClock(brt("2026-10-18", "12:00"), settings); // Dia 4
    expect(after.nextBaiStart).toBe(brt("2026-10-24", "12:00").toISOString());
  });

  it("dá o mesmo resultado em outro fuso horário do usuário", () => {
    const at = brt("2026-10-21", "22:30");
    const inBrazil = getBattleClock(at, settings);
    process.env.TZ = "Asia/Tokyo";
    expect(getBattleClock(at, settings)).toEqual(inBrazil);
  });
});
