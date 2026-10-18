// Confere se todos os idiomas têm as mesmas chaves de tradução que o pt-BR (idioma de referência).
// Uso: npm run check:locales
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public", "locales");
const BASE = "pt-BR";

function keys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

const load = (locale: string, ns: string) => JSON.parse(readFileSync(path.join(ROOT, locale, ns), "utf8"));

let problems = 0;
const locales = readdirSync(ROOT);
for (const ns of readdirSync(path.join(ROOT, BASE))) {
  const base = new Set(keys(load(BASE, ns)));
  for (const locale of locales.filter((l) => l !== BASE)) {
    let other: Set<string>;
    try {
      other = new Set(keys(load(locale, ns)));
    } catch {
      console.error(`✖ ${locale}/${ns}: arquivo ausente ou inválido`);
      problems++;
      continue;
    }
    const report = (message: string) => {
      problems++;
      console.error(message);
    };
    for (const k of base) if (!other.has(k)) report(`✖ ${locale}/${ns}: falta "${k}"`);
    for (const k of other) if (!base.has(k)) report(`✖ ${locale}/${ns}: sobra "${k}" (não existe em ${BASE})`);
  }
}
if (problems) {
  console.error(`\n${problems} problema(s) de tradução.`);
  process.exit(1);
}
console.log(`✔ ${locales.length} idiomas com as mesmas chaves.`);
