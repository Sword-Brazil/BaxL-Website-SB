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

/** Hash usado quando o e-mail não existe, para o tempo de resposta não revelar contas. */
const DUMMY_HASH = bcrypt.hashSync("dummy-password-0", BCRYPT_COST);

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

const invalidCredentials = () => new HttpError(401, "UNAUTHENTICATED", "E-mail ou senha incorretos");

/**
 * Login da curadoria (curadores e administradores) por e-mail e senha, com limite de
 * tentativas por `email|ip`: 5 falhas em 15 min → bloqueio de 15 min. Jogadores não têm conta:
 * os dados deles ficam no aparelho. Papel USER (acesso retirado) não entra.
 * Avisa o dono da conta: 3 falhas → aviso de tentativas; bloqueio → e-mail + aviso;
 * login certo → aviso de "novo login" nas outras sessões (`sessionId` é a sessão que entrou).
 */
export async function login(input: { email: string; password: string; ip: string; sessionId?: string; now?: Date }): Promise<SessionUser> {
  const now = input.now ?? new Date();
  const email = input.email.trim().toLowerCase();
  const key = `${email}|${input.ip}`;

  const attempt = await userRepository.getAttempt(key);
  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    throw new HttpError(429, "RATE_LIMITED", "Muitas tentativas. Tente novamente em alguns minutos.");
  }

  const user = await userRepository.findByEmail(email);
  const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  // Sem papel de curadoria = sem acesso; mesma resposta de senha errada (não revela a conta).
  if (!user || !ok || user.role === "USER") {
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
