import { describe, expect, it } from "vitest";
import { dayNumberSchema, emailSchema, passwordSchema } from "@/models/schemas/common";

describe("dayNumberSchema", () => {
  it.each([0, 29, 3, 10, 17, 24, 1.5])("rejeita %s", (n) => {
    expect(dayNumberSchema.safeParse(n).success).toBe(false);
  });

  it.each([1, 4, 28])("aceita %s", (n) => {
    expect(dayNumberSchema.safeParse(n).success).toBe(true);
  });
});

describe("passwordSchema", () => {
  it("exige letra e número", () => {
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("abcdefg1").success).toBe(true);
  });

  it("exige ao menos 8 caracteres", () => {
    expect(passwordSchema.safeParse("abc1").success).toBe(false);
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
