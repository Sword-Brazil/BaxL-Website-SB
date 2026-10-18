import { readFileSync } from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";

/** Campos de cada model declarados num schema.prisma (só os nomes). */
export function schemaFields(schema: string): Map<string, Set<string>> {
  const models = new Map<string, Set<string>>();
  let current: Set<string> | null = null;
  for (const line of schema.split("\n")) {
    const model = /^model\s+(\w+)\s*\{/.exec(line);
    if (model) models.set(model[1], (current = new Set()));
    else if (/^\}/.test(line)) current = null;
    else if (current) {
      const field = /^\s+(\w+)\s+\S/.exec(line);
      if (field) current.add(field[1]);
    }
  }
  return models;
}

/** Campos do schema que o Prisma Client em memória não conhece (vazio = em dia). */
export function missingFields(
  schema: string,
  loaded: readonly { name: string; fields: readonly { name: string }[] }[],
): string[] {
  const known = new Map(loaded.map((m) => [m.name, new Set(m.fields.map((f) => f.name))]));
  return [...schemaFields(schema)].flatMap(([model, fields]) =>
    [...fields].filter((f) => !known.get(model)?.has(f)).map((f) => `${model}.${f}`),
  );
}

/**
 * Em desenvolvimento: o `next dev` mantém na memória o Prisma Client de quando subiu. Depois de
 * uma migração (`prisma migrate dev` regenera o client), gravações com campos novos falham com
 * "Unknown argument" até reiniciar o servidor. Devolve a explicação, ou null se estiver em dia.
 */
export function stalePrismaClientHint(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const schema = readFileSync(path.join(process.cwd(), "node_modules/.prisma/client/schema.prisma"), "utf8");
    const missing = missingFields(schema, Prisma.dmmf.datamodel.models);
    return missing.length
      ? `Prisma Client desatualizado no servidor (não conhece ${missing.slice(0, 4).join(", ")}). Reinicie o "npm run dev".`
      : null;
  } catch {
    return null;
  }
}
