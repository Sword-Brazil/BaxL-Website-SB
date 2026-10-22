import { describe, expect, it } from "vitest";
import { dayCtpId, equipCtp, slotCtpId } from "@/models/rules/ctpAssign";

const equipment = { ctpByAgent: { wanda: "rage-b" } };

describe("equipCtp", () => {
  it("equipa um CTP em um personagem", () => {
    expect(equipCtp(equipment, "storm", "lib-m").ctpByAgent).toEqual({ wanda: "rage-b", storm: "lib-m" });
  });

  it("substitui o CTP anterior (um CTP por personagem)", () => {
    expect(equipCtp(equipment, "wanda", "insight-n").ctpByAgent.wanda).toBe("insight-n");
  });

  it("remove com null", () => {
    expect(equipCtp(equipment, "wanda", null).ctpByAgent).toEqual({});
  });

  it("não altera o objeto original", () => {
    equipCtp(equipment, "wanda", null);
    expect(equipment.ctpByAgent.wanda).toBe("rage-b");
  });
});

describe("CTP 2 e CTP do dia", () => {
  it("equipa o CTP 2 sem mexer no 1", () => {
    const next = equipCtp(equipment, "wanda", "insight-n", 2);
    expect(next.ctpByAgent).toEqual({ wanda: "rage-b" });
    expect(next.ctp2ByAgent).toEqual({ wanda: "insight-n" });
  });

  it("o dia usa o slot escolhido; sem CTP 2, vale o 1", () => {
    const eq = equipCtp(equipment, "wanda", "insight-n", 2);
    expect(dayCtpId({ ctpSlot: 2 }, eq, "wanda")).toBe("insight-n");
    expect(dayCtpId({ ctpSlot: 1 }, eq, "wanda")).toBe("rage-b");
    expect(dayCtpId({ ctpSlot: 2 }, equipment, "wanda")).toBe("rage-b");
    expect(slotCtpId(null, null, 2)).toBeNull();
  });

  it("equipes antigas mantêm o CTP do dia até escolher um slot", () => {
    expect(dayCtpId({ ctpId: "lib-m" }, equipment, "wanda")).toBe("lib-m");
    expect(dayCtpId({ ctpId: "lib-m", ctpSlot: 1 }, equipment, "wanda")).toBe("rage-b");
    expect(dayCtpId(null, equipment, "wanda")).toBe("rage-b");
  });
});
