import { describe, expect, it } from "vitest";
import { identityKey } from "@/models/rules/userIdentity";

describe("identityKey", () => {
  it("ignora maiúsculas, acentos, espaços e pontuação", () => {
    for (const name of ["sword menezes", "Sword.Menezes", "sword_menezes", "SWORD-MENEZES", "  swórd menezes "]) {
      expect(identityKey(name)).toBe("swordmenezes");
    }
  });

  it("mantém letras de outros alfabetos e números", () => {
    expect(identityKey("剣 Sword 2")).toBe("剣sword2");
  });

  it("nome vazio ou só com símbolos não tem chave", () => {
    expect(identityKey("")).toBeNull();
    expect(identityKey(null)).toBeNull();
    expect(identityKey("★ ★")).toBeNull();
  });
});
