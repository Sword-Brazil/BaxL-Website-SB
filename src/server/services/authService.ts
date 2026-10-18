import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { SessionUser } from "@/models/domain/types";
import type { RegisterInput } from "@/models/schemas/auth";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { userRepository } from "@/server/repositories/userRepository";
import { toSessionUser } from "@/server/session";
import { getMailService, type MailKind } from "./mailService";

const BCRYPT_COST = 12;
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60_000;
const LOCK_MS = 15 * 60_000;

/** Hash usado quando o e-mail não existe, para o tempo de resposta não revelar contas. */
const DUMMY_HASH = bcrypt.hashSync("dummy-password-0", BCRYPT_COST);

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

const invalidCredentials = () => new HttpError(401, "UNAUTHENTICATED", "E-mail ou senha incorretos");

/**
 * Login por e-mail e senha com limite de tentativas por `email|ip`:
 * 5 falhas em 15 min → bloqueio de 15 min. Contas não confirmadas podem entrar.
 */
export async function login(input: { email: string; password: string; ip: string; now?: Date }): Promise<SessionUser> {
  const now = input.now ?? new Date();
  const email = input.email.trim().toLowerCase();
  const key = `${email}|${input.ip}`;

  const attempt = await userRepository.getAttempt(key);
  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    throw new HttpError(429, "RATE_LIMITED", "Muitas tentativas. Tente novamente em alguns minutos.");
  }

  const user = await userRepository.findByEmail(email);
  const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    const windowOpen = attempt?.firstFailAt && now.getTime() - attempt.firstFailAt.getTime() < FAILURE_WINDOW_MS;
    const failedCount = windowOpen ? attempt.failedCount + 1 : 1;
    await userRepository.saveAttempt(key, {
      failedCount,
      firstFailAt: windowOpen ? attempt.firstFailAt! : now,
      lockedUntil: failedCount >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : null,
    });
    throw invalidCredentials();
  }

  await userRepository.clearAttempt(key);
  return toSessionUser(user);
}

// ---------- Cadastro, confirmação de e-mail e recuperação de senha ----------

const TOKEN_TTL_MS: Record<MailKind, number> = { VERIFY_EMAIL: 24 * 3_600_000, RESET_PASSWORD: 3_600_000 };
const LINK_PATH: Record<MailKind, string> = { VERIFY_EMAIL: "/verificar-email", RESET_PASSWORD: "/redefinir-senha" };

const sha256 = (token: string) => createHash("sha256").update(token).digest("hex");
const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

/** Gera um token de uso único (só o hash fica no banco) e envia o link. */
async function issueToken(user: { id: string; email: string }, kind: MailKind) {
  const token = randomBytes(32).toString("base64url");
  await prisma.authToken.create({
    data: { userId: user.id, kind, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS[kind]) },
  });
  await getMailService().send(user.email, kind, `${appUrl()}${LINK_PATH[kind]}?token=${token}`);
}

/** Consome um token válido (não usado e não expirado) do tipo pedido. */
async function consumeToken(token: string, kind: MailKind) {
  const row = await prisma.authToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.kind !== kind || row.usedAt || row.expiresAt <= new Date()) {
    throw new HttpError(400, "VALIDATION_ERROR", "Link inválido ou expirado");
  }
  const { count } = await prisma.authToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  if (count === 0) throw new HttpError(400, "VALIDATION_ERROR", "Link inválido ou expirado");
  return row.userId;
}

/** Cria a conta (papel USER). A resposta é a mesma se o e-mail já existir (não revela contas). */
export async function register(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();
  // O hash é calculado sempre, para o tempo de resposta não revelar se o e-mail existe.
  const passwordHash = await hashPassword(input.password);
  const existing = await userRepository.findByEmail(email);
  if (!existing) {
    const user = await prisma.user.create({
      data: { email, passwordHash, nickname: input.nickname || null, role: "USER" },
    });
    await issueToken(user, "VERIFY_EMAIL");
  }
  return { ok: true as const };
}

export async function verifyEmail(token: string) {
  const userId = await consumeToken(token, "VERIFY_EMAIL");
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return { ok: true as const };
}

/** Envia o link de redefinição se a conta existir; a resposta é sempre a mesma. */
export async function forgotPassword(rawEmail: string) {
  const user = await userRepository.findByEmail(rawEmail.trim().toLowerCase());
  if (user) await issueToken(user, "RESET_PASSWORD");
  return { ok: true as const };
}

export async function resetPassword(token: string, password: string) {
  const userId = await consumeToken(token, "RESET_PASSWORD");
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
  return { ok: true as const };
}
