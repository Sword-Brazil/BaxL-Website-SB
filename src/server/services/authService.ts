import bcrypt from "bcryptjs";
import type { SessionUser } from "@/models/domain/types";
import { HttpError } from "@/server/http";
import { userRepository } from "@/server/repositories/userRepository";
import { toSessionUser } from "@/server/session";
import { notify, notifyInBackground } from "./notificationService";

const BCRYPT_COST = 12;
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60_000;
const LOCK_MS = 15 * 60_000;
/** A partir de quantas falhas seguidas o dono da conta recebe o aviso de tentativas. */
const WARN_FAILURES = 3;

/** Hash usado quando o usuário não existe, para o tempo de resposta não revelar contas. */
const DUMMY_HASH = bcrypt.hashSync("dummy-password-0", BCRYPT_COST);

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

const invalidCredentials = () => new HttpError(401, "UNAUTHENTICATED", "Usuário ou senha incorretos");

/**
 * Login por nome de usuário e senha, com limite de tentativas por `usuário|ip`: 5 falhas em
 * 15 min → bloqueio de 15 min. Contas só são criadas por um
 * Administrador, que também é quem troca a senha de quem a esqueceu.
 * Avisa o dono da conta: 3 falhas → aviso de tentativas; bloqueio → aviso;
 * login certo → aviso de "novo login" nas outras sessões (`sessionId` é a sessão que entrou).
 */
export async function login(input: { username: string; password: string; ip: string; sessionId?: string; now?: Date }): Promise<SessionUser> {
  const now = input.now ?? new Date();
  const username = input.username.trim().toLowerCase().replace(/\s+/g, " ");
  const key = `${username}|${input.ip}`;

  const attempt = await userRepository.getAttempt(key);
  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    throw new HttpError(429, "RATE_LIMITED", "Muitas tentativas. Tente novamente em alguns minutos.");
  }

  const user = await userRepository.findByUsername(username);
  const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  // Conta inexistente e senha errada têm a mesma resposta (não revela quais contas existem).
  if (!user || !ok) {
    const { failedCount } = await userRepository.recordFailure(key, now, {
      windowMs: FAILURE_WINDOW_MS,
      maxFailures: MAX_FAILURES,
      lockMs: LOCK_MS,
    });
    if (user && failedCount === WARN_FAILURES) notifyInBackground({ type: "FAILED_LOGINS", userId: user.id });
    if (user && failedCount === MAX_FAILURES) notifyInBackground({ type: "ACCOUNT_LOCKED", userId: user.id });
    throw invalidCredentials();
  }

  await userRepository.clearAttempt(key);
  await notify({ type: "NEW_LOGIN", userId: user.id, originSessionId: input.sessionId });
  return toSessionUser(user);
}
