/**
 * Conteúdo do banco (nomes de personagens e trajes, rótulos, rotações) existe em português e em
 * inglês. O espanhol usa o inglês, como no jogo. Sem a versão em inglês, fica o português.
 */
export type ContentLang = "pt" | "en";

export const contentLang = (locale: string | undefined): ContentLang => (!locale || locale === "pt-BR" ? "pt" : "en");

/** O texto no idioma do conteúdo, com o português como reserva. */
export const pick = <T extends string | null>(pt: T, en: string | null | undefined, lang: ContentLang): T | string =>
  lang === "en" && en?.trim() ? en : pt;

/**
 * Rótulo de uma equipe Meta: o inglês cadastrado ou, sem ele, "Alternativa" / "Alternativa N"
 * traduzido sozinho (são os rótulos mais comuns). Outros rótulos ficam em português.
 */
export function teamLabel(label: string | null, labelEn: string | null, lang: ContentLang): string | null {
  if (lang === "pt" || !label) return label;
  if (labelEn?.trim()) return labelEn;
  const alt = /^alternativa(?:\s*(\d+))?$/i.exec(label.trim());
  return alt ? (alt[1] ? `Alternative ${alt[1]}` : "Alternative") : label;
}
