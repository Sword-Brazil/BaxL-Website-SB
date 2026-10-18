import { UserSelectionsSchema, type UserSelections } from "@/models/schemas/selections";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";

export async function getSelections(userId: string): Promise<UserSelections | null> {
  const row = await prisma.userSelectionsDoc.findUnique({ where: { userId } });
  if (!row) return null;
  const parsed = UserSelectionsSchema.safeParse({ ...JSON.parse(row.json), updatedAt: row.updatedAt.toISOString() });
  return parsed.success ? parsed.data : null;
}

/**
 * Salva as seleções do usuário. Se `baseUpdatedAt` for informado e diferente do que está no
 * servidor, outro aparelho salvou antes: 409 (o cliente pergunta qual versão manter).
 */
export async function putSelections(userId: string, doc: UserSelections, baseUpdatedAt?: string | null): Promise<UserSelections> {
  const current = await prisma.userSelectionsDoc.findUnique({ where: { userId } });
  if (current && baseUpdatedAt && current.updatedAt.toISOString() !== baseUpdatedAt) {
    throw new HttpError(409, "CONFLICT", "As seleções foram alteradas em outro aparelho");
  }
  // updatedAt sempre avança, mesmo em gravações no mesmo milissegundo.
  const updatedAt = new Date(Math.max(Date.now(), (current?.updatedAt.getTime() ?? 0) + 1));
  const json = JSON.stringify({ version: doc.version, roster: doc.roster, teams: doc.teams });
  const row = await prisma.userSelectionsDoc.upsert({
    where: { userId },
    update: { json, updatedAt },
    create: { userId, json, updatedAt },
  });
  return { ...doc, updatedAt: row.updatedAt.toISOString() };
}
