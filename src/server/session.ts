import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession, type SessionOptions } from "iron-session";
import type { Role } from "@/models/domain/enums";
import type { SessionUser } from "@/models/domain/types";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";

export interface SessionData {
  userId?: string;
}

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET ausente ou com menos de 32 caracteres. Configure em .env.local.");
  }
  return {
    password,
    cookieName: "mff_session",
    ttl: 60 * 60 * 24 * 30, // 30 dias
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export function getSession(req: NextApiRequest, res: NextApiResponse) {
  return getIronSession<SessionData>(req, res, sessionOptions());
}

export function toSessionUser(u: { id: string; email: string; nickname: string | null; role: string }): SessionUser {
  return { id: u.id, email: u.email, nickname: u.nickname, role: u.role as Role };
}

/** Usuário da sessão, lido do banco a cada requisição (mudança de papel vale na hora). */
export async function getSessionUser(req: NextApiRequest, res: NextApiResponse): Promise<SessionUser | null> {
  const session = await getSession(req, res);
  if (!session.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    session.destroy();
    return null;
  }
  return toSessionUser(user);
}

export async function requireUser(req: NextApiRequest, res: NextApiResponse): Promise<SessionUser> {
  const user = await getSessionUser(req, res);
  if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Faça login para continuar");
  return user;
}

const RANK: Record<Role, number> = { USER: 0, CURATOR: 1, ADMIN: 2 };

export function hasRole(user: SessionUser | null, role: Role): boolean {
  return !!user && RANK[user.role] >= RANK[role];
}

/** Exige o papel informado. ADMIN satisfaz CURATOR. */
export async function requireRole(req: NextApiRequest, res: NextApiResponse, role: "CURATOR" | "ADMIN") {
  const user = await requireUser(req, res);
  if (!hasRole(user, role)) throw new HttpError(403, "FORBIDDEN", "Acesso negado");
  return user;
}
