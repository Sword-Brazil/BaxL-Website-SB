import type { SessionOptions } from "iron-session";

/** Cookie da sessão (iron-session), compartilhado pelas rotas de API e pelo proxy. */
export function sessionOptions(): SessionOptions {
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

/** Sem "manter logado", a sessão vale no máximo isto (mesmo se o navegador restaurar o cookie). */
export const SHORT_SESSION_MS = 12 * 60 * 60 * 1000;

/** Opções para quem NÃO marcou "manter logado": cookie de sessão (some ao fechar o navegador). */
export function shortSessionOptions(): SessionOptions {
  const base = sessionOptions();
  return { ...base, cookieOptions: { ...base.cookieOptions, maxAge: undefined } };
}

/**
 * Com "manter logado", o cookie é regravado (mais 30 dias) no máximo uma vez por dia em que o site
 * é aberto: quem usa o site não precisa entrar de novo, só quem ficar 30 dias sem abrir.
 */
export const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

export function shouldRenewSession(data: { userId?: string; remember?: boolean; renewedAt?: number }, now = Date.now()): boolean {
  return !!data.userId && data.remember !== false && (data.renewedAt === undefined || now - data.renewedAt >= RENEW_AFTER_MS);
}

/** A sessão ainda vale? `expiresAt` só existe nas sessões sem "manter logado". */
export function isSessionActive(data: { userId?: string; expiresAt?: number }, now = Date.now()): boolean {
  return !!data.userId && (data.expiresAt === undefined || now < data.expiresAt);
}
