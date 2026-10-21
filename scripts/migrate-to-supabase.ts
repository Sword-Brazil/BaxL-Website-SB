// Copia os dados do SQLite local (prisma/dev.db) para o Postgres do Supabase e envia as imagens de
// public/assets/uploads para o Supabase Storage, trocando os caminhos /assets/uploads/... pelas
// URLs públicas. Roda num banco VAZIO (logo depois do `prisma migrate deploy` e ANTES do seed: o
// seed criaria CTPs, dias e o administrador com outros ids). Se cair no meio, pode rodar de novo
// com --resume: linhas que já existem (mesmo id) são puladas.
//
// Uso (com DATABASE_URL/DIRECT_URL do Supabase):
//   npx prisma migrate deploy && npm run db:migrate-data && npx prisma db seed
//   npm run db:migrate-data                    # dados + imagens
//   npm run db:migrate-data -- --skip-uploads  # só os dados (imagens continuam com o caminho local)
//   npm run db:migrate-data -- --sqlite=outro.db
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Prisma, PrismaClient } from "@prisma/client";
import { ensureBucket, publicUrl, storageConfig } from "../src/server/storage";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = process.argv.slice(2);
const skipUploads = args.includes("--skip-uploads");
const resume = args.includes("--resume");
const sqlitePath = args.find((a) => a.startsWith("--sqlite="))?.slice("--sqlite=".length) ?? path.join("prisma", "dev.db");

/** Ordem das chaves estrangeiras. LoginAttempt (bloqueios temporários) não é copiado. */
const MODELS = [
  "Agent",
  "Uniform",
  "Ctp",
  "Settings",
  "BattleDay",
  "RestrictionCriterion",
  "User",
  "UserSelectionsDoc",
  "MetaTeam",
  "MetaTeamMember",
  "Rotation",
  "PriorityEntry",
  "BaiBoss",
  "SecurityNotice",
] as const;

const UPLOADS_DIR = path.join("public", "assets", "uploads");
const UPLOADS_PREFIX = "/assets/uploads/";
const MIME: Record<string, string> = { ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

async function uploadImages(): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (skipUploads || !existsSync(UPLOADS_DIR)) return urls;
  const config = storageConfig();
  if (!config) throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou use --skip-uploads).");
  await ensureBucket(config);
  const files = readdirSync(UPLOADS_DIR).filter((f) => MIME[path.extname(f).toLowerCase()]);
  for (const file of files) {
    const objectPath = `uploads/${file}`;
    const res = await fetch(`${config.url}/storage/v1/object/${config.bucket}/${objectPath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.key}`,
        apikey: config.key,
        "Content-Type": MIME[path.extname(file).toLowerCase()],
        "x-upsert": "true",
        "Cache-Control": "max-age=31536000",
      },
      body: readFileSync(path.join(UPLOADS_DIR, file)),
    });
    if (!res.ok) throw new Error(`Falha ao enviar ${file}: ${res.status} ${await res.text()}`);
    urls.set(`${UPLOADS_PREFIX}${file}`, publicUrl(config, objectPath));
  }
  console.log(`✔ ${files.length} imagens enviadas ao bucket "${config.bucket}"`);
  return urls;
}

/** Converte uma linha do SQLite (datas em ms, booleanos 0/1) para o formato do Prisma. */
function convert(model: Prisma.DMMF.Model, row: Record<string, unknown>, urls: Map<string, string>) {
  const out: Record<string, unknown> = {};
  for (const field of model.fields) {
    if (field.kind !== "scalar" || !(field.name in row)) continue;
    const value = row[field.name];
    if (value === null || value === undefined) {
      out[field.name] = null;
    } else if (field.type === "DateTime") {
      out[field.name] = new Date(typeof value === "number" || typeof value === "bigint" ? Number(value) : String(value));
    } else if (field.type === "Boolean") {
      out[field.name] = Boolean(Number(value));
    } else if (field.type === "Int") {
      out[field.name] = Number(value);
    } else if (typeof value === "string" && value.startsWith(UPLOADS_PREFIX)) {
      out[field.name] = urls.get(value) ?? value;
    } else {
      out[field.name] = value;
    }
  }
  return out;
}

async function main() {
  if (!existsSync(sqlitePath)) throw new Error(`Banco SQLite não encontrado: ${sqlitePath}`);
  if (!process.env.DATABASE_URL?.startsWith("postgres")) throw new Error("DATABASE_URL precisa apontar para o Postgres (Supabase).");

  const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
  const tables = new Set(
    (sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((t) => t.name),
  );
  const prisma = new PrismaClient();
  try {
    const models = new Map(Prisma.dmmf.datamodel.models.map((m) => [m.name, m]));
    const delegateOf = (name: string) =>
      (prisma as unknown as Record<string, { createMany: (a: object) => Promise<{ count: number }>; count: () => Promise<number> }>)[
        name[0].toLowerCase() + name.slice(1)
      ];
    if (!resume) {
      for (const name of MODELS) {
        if ((await delegateOf(name).count()) > 0) {
          throw new Error(
            `O Postgres já tem dados (${name}). Rode num banco recém-migrado, antes do seed, ou use --resume para continuar uma cópia interrompida.`,
          );
        }
      }
    }
    const urls = await uploadImages();
    for (const name of MODELS) {
      if (!tables.has(name)) continue;
      const model = models.get(name)!;
      const rows = sqlite.prepare(`SELECT * FROM "${name}"`).all() as Record<string, unknown>[];
      const data = rows.map((r) => convert(model, r, urls));
      const delegate = delegateOf(name);
      let created = 0;
      for (let i = 0; i < data.length; i += 500) {
        created += (await delegate.createMany({ data: data.slice(i, i + 500), skipDuplicates: true })).count;
      }
      console.log(`✔ ${name}: ${rows.length} no SQLite, ${created} novas no Postgres (total ${await delegate.count()})`);
    }
    const local = { imagePath: { startsWith: UPLOADS_PREFIX } };
    const left = (await prisma.uniform.count({ where: local })) + (await prisma.ctp.count({ where: local }));
    if (left) console.warn(`⚠ ${left} imagens ainda apontam para ${UPLOADS_PREFIX} (rode sem --skip-uploads para enviá-las).`);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
