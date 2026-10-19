import type { Role } from "@/models/domain/enums";
import type { CreateStaffInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { toSessionUser } from "@/server/session";
import { hashPassword } from "./authService";
import { notify } from "./notificationService";

const PAGE_SIZE = 20;

export async function listUsers({ q, page = 1 }: { q?: string; page?: number }) {
  const where = q ? { OR: [{ email: { contains: q.toLowerCase() } }, { nickname: { contains: q } }] } : {};
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { email: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return {
    total,
    page,
    pageSize: PAGE_SIZE,
    users: rows.map((u) => ({ ...toSessionUser(u), emailVerified: !!u.emailVerifiedAt, createdAt: u.createdAt.toISOString() })),
  };
}

/** Cadastro de novos Curadores/Administradores por um Administrador (conta já verificada). */
export async function createStaff(input: CreateStaffInput) {
  const email = input.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new HttpError(409, "CONFLICT", "E-mail já cadastrado");
  }
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(input.password),
      nickname: input.nickname || null,
      role: input.role,
      emailVerifiedAt: new Date(),
    },
  });
  return toSessionUser(user);
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
