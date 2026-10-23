import { Prisma } from "@prisma/client";
import type { Role } from "@/models/domain/enums";
import { identityKey } from "@/models/rules/userIdentity";
import type { CreateUserInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { toSessionUser } from "@/server/session";
import { hashPassword } from "./authService";
import { notify } from "./notificationService";

const PAGE_SIZE = 20;

export async function listUsers({ q, page = 1 }: { q?: string; page?: number }) {
  const contains = { contains: q ?? "", mode: "insensitive" as const };
  const where = q ? { OR: [{ username: contains }, { nickname: contains }] } : {};
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { username: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return {
    total,
    page,
    pageSize: PAGE_SIZE,
    users: rows.map((u) => ({
      ...toSessionUser(u),
      createdAt: u.createdAt.toISOString(),
      // Sem a chave que o nome deveria ter: conta antiga que repete outra (ver a migração das chaves).
      duplicate: (!u.usernameKey && !!identityKey(u.username)) || (!u.nicknameKey && !!identityKey(u.nickname)),
    })),
  };
}

const usernameTaken = () => new HttpError(409, "CONFLICT", "Já existe uma conta com esse nome de usuário", { username: ["Já existe uma conta com esse nome de usuário"] });
const nicknameTaken = () => new HttpError(409, "CONFLICT", "Esse apelido já é de outra conta", { nickname: ["Esse apelido já é de outra conta"] });

/**
 * Cadastro de contas (membros e administradores): só um Administrador cria. Bloqueia a mesma
 * pessoa em duas contas: nome de usuário ou apelido que só mudam em maiúsculas, acentos, espaços
 * ou pontuação ("sword.menezes" = "Sword Menezes").
 */
export async function createUser(input: CreateUserInput) {
  const username = input.username.trim().toLowerCase().replace(/\s+/g, " ");
  const nickname = input.nickname?.trim().replace(/\s+/g, " ") || null;
  const usernameKey = identityKey(username);
  const nicknameKey = identityKey(nickname);
  const [byUsername, byNickname] = await Promise.all([
    prisma.user.findFirst({ where: { OR: [{ username }, ...(usernameKey ? [{ usernameKey }] : [])] } }),
    nicknameKey ? prisma.user.findUnique({ where: { nicknameKey } }) : null,
  ]);
  if (byUsername) throw usernameTaken();
  if (byNickname) throw nicknameTaken();
  try {
    const user = await prisma.user.create({
      data: { username, usernameKey, passwordHash: await hashPassword(input.password), nickname, nicknameKey, role: input.role },
    });
    return toSessionUser(user);
  } catch (e) {
    // Outro administrador criou a mesma conta ao mesmo tempo.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw String(e.meta?.target ?? "").includes("nickname") ? nicknameTaken() : usernameTaken();
    }
    throw e;
  }
}

/** Altera o papel; bloqueia rebaixar o último Administrador (409). */
export async function changeRole(userId: string, role: Role) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "NOT_FOUND", "Usuário não encontrado");
  if (user.role === "ADMIN" && role !== "ADMIN" && (await prisma.user.count({ where: { role: "ADMIN" } })) <= 1) {
    throw new HttpError(409, "CONFLICT", "Não é possível rebaixar o último administrador");
  }
  const updated = await prisma.user.update({ where: { id: userId }, data: { role } });
  if (user.role !== role) await notify({ type: "ROLE_CHANGED", userId, params: { role } });
  return toSessionUser(updated);
}

export async function adminResetPassword(userId: string, password: string) {
  const { count } = await prisma.user.updateMany({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
  if (count === 0) throw new HttpError(404, "NOT_FOUND", "Usuário não encontrado");
  await notify({ type: "PASSWORD_RESET", userId });
}

/**
 * Exclui a conta (ex.: a pessoa saiu da aliança). Saem junto o elenco, as equipes, as pontuações e
 * os avisos dela; equipes Meta que ela editou ficam sem autor. A sessão aberta dela termina na
 * próxima requisição. Ninguém exclui a própria conta, então sempre sobra um administrador.
 */
export async function deleteUser(userId: string, actorId: string) {
  if (userId === actorId) throw new HttpError(409, "CONFLICT", "Não é possível excluir a própria conta");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "NOT_FOUND", "Usuário não encontrado");
  await prisma.$transaction([
    prisma.user.delete({ where: { id: userId } }),
    // Tentativas de login guardadas por "usuário|ip": uma conta nova com o mesmo nome começa limpa.
    prisma.loginAttempt.deleteMany({ where: { key: { startsWith: `${user.username}|` } } }),
  ]);
}
