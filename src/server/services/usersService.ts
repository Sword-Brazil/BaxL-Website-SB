import { Prisma } from "@prisma/client";
import type { Role } from "@/models/domain/enums";
import type { CreateUserInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { toSessionUser } from "@/server/session";
import { hashPassword } from "./authService";
import { notify } from "./notificationService";

const PAGE_SIZE = 20;

export async function listUsers({ q, page = 1 }: { q?: string; page?: number }) {
  const contains = { contains: q ?? "", mode: "insensitive" as const };
  const where = q ? { OR: [{ username: contains }, { email: contains }, { nickname: contains }] } : {};
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { username: { sort: "asc", nulls: "last" } }, { email: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return {
    total,
    page,
    pageSize: PAGE_SIZE,
    users: rows.map((u) => ({ ...toSessionUser(u), createdAt: u.createdAt.toISOString() })),
  };
}

/** Cadastro de contas (jogadores, curadores e administradores): só um Administrador cria. */
export async function createUser(input: CreateUserInput) {
  const username = input.username?.trim().toLowerCase() || null;
  const email = input.email?.trim().toLowerCase() || null;
  if (!username && !email) throw new HttpError(400, "VALIDATION_ERROR", "Informe um nome de usuário ou um e-mail");
  if (username && (await prisma.user.findUnique({ where: { username } }))) {
    throw new HttpError(409, "CONFLICT", "Nome de usuário já cadastrado");
  }
  if (email && (await prisma.user.findUnique({ where: { email } }))) {
    throw new HttpError(409, "CONFLICT", "E-mail já cadastrado");
  }
  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await hashPassword(input.password),
        nickname: input.nickname || null,
        role: input.role,
        emailVerifiedAt: email ? new Date() : null,
      },
    });
    return toSessionUser(user);
  } catch (e) {
    // Outro administrador criou a mesma conta ao mesmo tempo.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "CONFLICT", "Conta já cadastrada");
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
