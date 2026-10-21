import { describe, expect, it } from "vitest";
import { passwordStrength } from "@/models/rules/passwordStrength";
import { dayNumberSchema, emailSchema, passwordSchema, usernameSchema } from "@/models/schemas/common";

describe("dayNumberSchema", () => {
  it.each([0, 29, 3, 10, 17, 24, 1.5])("rejeita %s", (n) => {
    expect(dayNumberSchema.safeParse(n).success).toBe(false);
  });

  it.each([1, 4, 28])("aceita %s", (n) => {
    expect(dayNumberSchema.safeParse(n).success).toBe(true);
  });
});

describe("passwordSchema", () => {
  it("senha forte: minúscula, MAIÚSCULA, número e símbolo", () => {
    expect(passwordSchema.safeParse("abcdefg1").success).toBe(false);
    expect(passwordSchema.safeParse("Abcdefg1").success).toBe(false);
    expect(passwordSchema.safeParse("abcdefg1!").success).toBe(false);
    expect(passwordSchema.safeParse("Desenho.2020!").success).toBe(true);
  });

  it("exige ao menos 8 caracteres", () => {
    expect(passwordSchema.safeParse("Ab1!").success).toBe(false);
  });
});

describe("passwordStrength", () => {
  it("vazia, fraca, razoável, boa e forte", () => {
    expect(passwordStrength("").level).toBe(0);
    expect(passwordStrength("abc").level).toBe(1);
    expect(passwordStrength("xkwmtrp1").level).toBe(2);
    expect(passwordStrength("abcdefg1").level).toBe(1); // sequência "abcd" perde força
    expect(passwordStrength("Abcdef1!").level).toBe(3);
    expect(passwordStrength("Desenho.2020!").level).toBe(4);
  });

  it("só é boa se cumprir todas as regras do passwordSchema", () => {
    for (const p of ["abcdefgh", "Abcdefg1", "Desenho.2020!", "xY9!xY9!xY9!"]) {
      expect(passwordStrength(p).valid).toBe(passwordSchema.safeParse(p).success);
    }
  });

  it("padrões fáceis (sequência, repetição, palavras comuns) perdem força", () => {
    expect(passwordStrength("Senha12345!!").level).toBeLessThan(passwordStrength("Tq7#vLp2&wZx").level);
  });
});

describe("usernameSchema", () => {
  it("aceita espaços (guardado em minúsculas, espaços simples)", () => {
    expect(usernameSchema.parse("  Sword   Menezes ")).toBe("sword menezes");
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse(" x ").success).toBe(false);
    expect(usernameSchema.safeParse("nome@site").success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("normaliza espaços e maiúsculas", () => {
    expect(emailSchema.parse("  Yago@Example.COM ")).toBe("yago@example.com");
  });

  it("rejeita e-mail inválido", () => {
    expect(emailSchema.safeParse("nao-e-email").success).toBe(false);
  });
});
