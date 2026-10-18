import { describe, expect, it } from "vitest";
import { equipCtp } from "@/models/rules/ctpAssign";

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
