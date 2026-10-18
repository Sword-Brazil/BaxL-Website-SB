import { afterAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { setZodLocale } from "@/lib/zodLocale";

const message = () => z.string().min(1).safeParse("").error!.issues[0].message;
const tooShort = () => z.string().min(3).safeParse("a").error!.issues[0].message;

describe("setZodLocale", () => {
  afterAll(() => setZodLocale("pt-BR"));

  it("usa português por padrão: texto vazio é 'Campo obrigatório'", () => {
    expect(message()).toBe("Campo obrigatório");
    expect(tooShort()).toMatch(/pequeno/i);
  });

  it("segue o idioma da interface; idioma desconhecido volta ao português", () => {
    setZodLocale("en");
    expect(message()).toBe("Required");
    expect(tooShort()).toMatch(/Too small/);
    setZodLocale("es");
    expect(message()).toBe("Campo obligatorio");
    setZodLocale("xx");
    expect(message()).toBe("Campo obrigatório");
  });
});
