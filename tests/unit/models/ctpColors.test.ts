import { describe, expect, it } from "vitest";
import { CTP_QUALITIES, CTP_TYPES } from "@/models/domain/enums";
import { CTP_COLORS } from "@/models/domain/ctpColors";

describe("CTP_COLORS", () => {
  it("tem uma cor para cada tipo × qualidade, sem cores repetidas", () => {
    const colors = CTP_TYPES.flatMap((t) => CTP_QUALITIES.map((q) => CTP_COLORS[t][q].toUpperCase()));
    expect(colors).toHaveLength(18);
    expect(new Set(colors).size).toBe(18);
  });
});
