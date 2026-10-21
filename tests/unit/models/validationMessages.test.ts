import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VALIDATION, validationCode } from "@/models/schemas/messages";
import { LoginSchema } from "@/models/schemas/auth";

const locale = (l: string) => JSON.parse(readFileSync(`public/locales/${l}/common.json`, "utf8")).validation as Record<string, string>;

describe("mensagens de validação", () => {
  it("toda mensagem própria tem tradução nos 3 idiomas", () => {
    for (const l of ["pt-BR", "en", "es"]) expect(Object.keys(locale(l)).sort()).toEqual(Object.keys(VALIDATION).sort());
  });

  it("o código é achado a partir da mensagem que o schema devolve", () => {
    const issue = LoginSchema.safeParse({ login: " ", password: "" }).error!.issues;
    expect(issue.map((i) => validationCode(i.message))).toEqual(["loginRequired", "passwordRequired"]);
    expect(validationCode("qualquer outra")).toBeUndefined();
  });
});
