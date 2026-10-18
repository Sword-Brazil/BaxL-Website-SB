/** Identificador em kebab-case, sem acentos (ex.: "Valquíria" → "valquiria"). */
export function slugify(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}
