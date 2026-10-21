import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import type { Role } from "@/models/domain/enums";
import type { SessionUser } from "@/models/domain/types";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { sessionOptions } from "@/server/sessionOptions";

export interface SessionData {
  userId?: string;
  /** Identifica esta sessão (avisos de "novo login" não aparecem na sessão que entrou). */
  sid?: string;
  /** Início da sessão (ISO): avisos de "novo login" anteriores a ele não aparecem. */
  loginAt?: string;
}

export function getSession(req: NextApiRequest, res: NextApiResponse) {
  return getIronSession<SessionData>(req, res, sessionOptions());
}

export function toSessionUser(u: { id: string; username: string; nickname: string | null; role: string }): SessionUser {
  return { id: u.id, username: u.username, nickname: u.nickname, role: u.role as Role };
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
