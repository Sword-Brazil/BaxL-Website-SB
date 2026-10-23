/** Texto para comparar: minúsculas, sem acentos e com espaços simples ("Fênix  Negra" → "fenix negra"). */
export const normalizeSearch = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Filtra pelo nome (sem acento nem maiúscula), na ordem: começa com o texto, tem uma palavra que
 * começa com ele, contém o texto. Dentro de cada grupo, mantém a ordem original. Texto vazio = tudo.
 */
export function searchByName<T>(items: T[], query: string, namesOf: (item: T) => string[]): T[] {
  const q = normalizeSearch(query);
  if (!q) return items;
  const rank = (item: T) => {
    const names = namesOf(item).map(normalizeSearch);
    if (names.some((n) => n.startsWith(q))) return 0;
    if (names.some((n) => n.split(/[\s\-/().]+/).some((w) => w.startsWith(q)))) return 1;
    if (names.some((n) => n.includes(q))) return 2;
    return -1;
  };
  return items
    .map((item, i) => ({ item, i, r: rank(item) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.item);
}
