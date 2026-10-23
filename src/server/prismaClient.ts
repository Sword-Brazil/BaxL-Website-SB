import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Prisma Client ligado ao Postgres pelo driver `pg` (no Prisma 7 o client sempre usa um adaptador).
 * A URL continua a mesma do .env.local: os parâmetros que eram do motor antigo do Prisma viram
 * opções do pool. `connection_limit` → tamanho do pool; `pgbouncer` não precisa mais (o `pg` não
 * usa prepared statements nomeados, então funciona no "Transaction pooler" do Supabase).
 * SSL: sem `sslmode` na URL, criptografa sem validar o certificado (como o `sslmode=prefer` do
 * motor antigo; o certificado do Supabase não é de uma autoridade que o Node conheça). Banco local
 * fica sem SSL. `sslmode=disable` desliga.
 */
export function createPrismaClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL não definida (veja .env.example)");
  const url = new URL(connectionString);
  const max = Number(url.searchParams.get("connection_limit")) || undefined;
  const sslmode = url.searchParams.get("sslmode");
  for (const param of ["connection_limit", "pgbouncer", "sslmode"]) url.searchParams.delete(param);
  const ssl = sslmode === "disable" || (!sslmode && LOCAL_HOSTS.has(url.hostname)) ? false : { rejectUnauthorized: false };
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString(), max, ssl }) });
}
