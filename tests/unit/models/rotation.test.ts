import { describe, expect, it } from "vitest";
import { formatRotation, normalizeRotation, parseRotation } from "@/models/rules/rotation";

describe("parseRotation", () => {
  it("lê passos, cancelamentos e grupos opcionais", () => {
    const r = parseRotation("1 2c (3dc 4) 6qc");
    expect(r).toEqual({
      ok: true,
      parts: [
        { skill: 1, cancel: null },
        { skill: 2, cancel: "c" },
        [
          { skill: 3, cancel: "dc" },
          { skill: 4, cancel: null },
        ],
        { skill: 6, cancel: "qc" },
      ],
    });
  });

  it("aceita os separadores comuns e maiúsculas", () => {
    expect(normalizeRotation("1C > 2DC → (3,4) - 5 – 6")).toBe("1c 2dc (3 4) 5 6");
    expect(normalizeRotation("(5 4c)6")).toBe("(5 4c) 6");
  });

  it("recusa habilidades fora de 1–6 e sufixos desconhecidos", () => {
    expect(parseRotation("1 7")).toEqual({ ok: false, error: "token", token: "7" });
    expect(parseRotation("1x")).toEqual({ ok: false, error: "token", token: "1x" });
  });

  it("recusa parênteses errados", () => {
    expect(parseRotation("(1 2")).toMatchObject({ error: "unclosedGroup" });
    expect(parseRotation("1 2)")).toMatchObject({ error: "unopenedGroup" });
    expect(parseRotation("((1))")).toMatchObject({ error: "nestedGroup" });
    expect(parseRotation("1 () 2")).toMatchObject({ error: "emptyGroup" });
  });

  it("recusa vazio e rotações longas demais", () => {
    expect(parseRotation("  ")).toMatchObject({ error: "empty" });
    expect(parseRotation(Array(31).fill("1").join(" "))).toMatchObject({ error: "tooLong" });
  });

  it("formatRotation é a volta do parse", () => {
    const text = "3 1c 2dc (5 4qc) 6";
    const r = parseRotation(text);
    expect(r.ok && formatRotation(r.parts)).toBe(text);
  });

  it("normalizeRotation: vazio ou inválido vira null", () => {
    expect(normalizeRotation("")).toBeNull();
    expect(normalizeRotation(null)).toBeNull();
    expect(normalizeRotation("1 9")).toBeNull();
  });
});
