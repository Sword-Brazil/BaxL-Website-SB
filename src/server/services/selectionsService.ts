// Elenco, equipes, CTPs e nome no jogo do jogador logado, iguais em todos os aparelhos.
import { Prisma } from "@prisma/client";
import { UserSelectionsSchema, type UserSelections } from "@/models/schemas/selections";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";

export async function getSelections(userId: string): Promise<UserSelections | null> {
  const row = await prisma.userSelectionsDoc.findUnique({ where: { userId } });
  if (!row) return null;
  const parsed = UserSelectionsSchema.safeParse({ ...JSON.parse(row.json), updatedAt: row.updatedAt.toISOString() });
  return parsed.success ? parsed.data : null;
}

const conflict = () => new HttpError(409, "CONFLICT", "As seleções foram alteradas em outro aparelho");

/** Cria o documento; se outro aparelho criou ao mesmo tempo, é conflito. */
async function createDoc(userId: string, json: string, updatedAt: Date) {
  try {
    return await prisma.userSelectionsDoc.create({ data: { userId, json, updatedAt } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw conflict();
    throw e;
  }
}

/**
 * Salva as seleções do usuário. A gravação é condicional e atômica: com `baseUpdatedAt`, só
 * atualiza se o servidor ainda estiver nessa versão; sem base, só cria se ainda não existir.
 * Caso contrário outro aparelho salvou antes: 409 (o cliente pergunta qual versão manter).
 */
export async function putSelections(userId: string, doc: UserSelections, baseUpdatedAt?: string | null): Promise<UserSelections> {
  const json = JSON.stringify({ version: doc.version, nickname: doc.nickname, roster: doc.roster, teams: doc.teams, equipment: doc.equipment, freePick: doc.freePick, syncFreeDays: doc.syncFreeDays, scores: doc.scores, scoreSeasons: doc.scoreSeasons });
  const base = baseUpdatedAt ? new Date(baseUpdatedAt) : null;
  if (base && Number.isNaN(base.getTime())) throw conflict();

  if (!base) {
    const row = await createDoc(userId, json, new Date());
    return { ...doc, updatedAt: row.updatedAt.toISOString() };
  }

  // updatedAt sempre avança, mesmo em gravações no mesmo milissegundo.
  const updatedAt = new Date(Math.max(Date.now(), base.getTime() + 1));
  const { count } = await prisma.userSelectionsDoc.updateMany({ where: { userId, updatedAt: base }, data: { json, updatedAt } });
  if (count === 1) return { ...doc, updatedAt: updatedAt.toISOString() };

  // Base desconhecida: se o documento não existe mais, recria; se existe, mudou em outro aparelho.
  if (await prisma.userSelectionsDoc.findUnique({ where: { userId }, select: { userId: true } })) throw conflict();
  const row = await createDoc(userId, json, updatedAt);
  return { ...doc, updatedAt: row.updatedAt.toISOString() };
}
