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
