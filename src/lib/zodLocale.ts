import { z } from "zod";

const LOCALES: Record<string, () => z.core.$ZodConfig> = { "pt-BR": z.locales.pt, en: z.locales.en, es: z.locales.es };
const REQUIRED: Record<string, string> = { "pt-BR": "Campo obrigatório", en: "Required", es: "Campo obligatorio" };

/**
 * Idioma das mensagens padrão do Zod (campos sem mensagem própria). Sem isso, formulários em
 * português mostravam "Too small: expected string…". Texto vazio vira "Campo obrigatório".
 */
export function setZodLocale(locale: string | undefined) {
  const key = locale && LOCALES[locale] ? locale : "pt-BR";
  z.config({
    ...LOCALES[key](),
    customError: (issue) =>
      issue.code === "too_small" && issue.origin === "string" && issue.minimum === 1 ? REQUIRED[key] : undefined,
  });
}

// Padrão: servidor (respostas da API) e primeira renderização em português.
setZodLocale("pt-BR");
