import type { Severity } from "./securityEvents";

// Erros do app no mesmo padrão dos eventos de segurança: cada tipo tem uma gravidade fixa e a
// gravidade decide o canal. Leves → notificação (toast); graves → alerta fixo na tela.

export const APP_ERRORS = {
  /** O navegador não alcançou o servidor (sem internet, servidor fora do ar). */
  NETWORK: "CRITICAL",
  /** O servidor não alcançou o banco de dados (503). */
  DATABASE: "CRITICAL",
  /** Banco atualizado e código ainda não (ou o contrário): site em manutenção (503 MAINTENANCE). */
  MAINTENANCE: "CRITICAL",
  /** Erro inesperado no servidor (500). */
  SERVER: "CRITICAL",
  /** Acesso indevido: sem permissão ou origem não permitida (403). */
  FORBIDDEN: "CRITICAL",
  /** Sessão terminou ou foi encerrada (401). */
  SESSION_EXPIRED: "CRITICAL",
  /** Muitas tentativas em pouco tempo (429). */
  RATE_LIMITED: "ATTENTION",
  /** Dados alterados em outro lugar ao mesmo tempo (409). */
  CONFLICT: "INFO",
  /** Dados inválidos (400, 415, 422). */
  INVALID: "INFO",
  NOT_FOUND: "INFO",
  UNKNOWN: "INFO",
} as const satisfies Record<string, Severity>;

export type AppErrorKind = keyof typeof APP_ERRORS;

/** Canal de cada gravidade: graves viram alerta fixo; o resto, notificação. */
export const appErrorChannel = (kind: AppErrorKind): "alert" | "toast" => (APP_ERRORS[kind] === "CRITICAL" ? "alert" : "toast");

/** Tipo do erro a partir do status HTTP (ApiError) ou da falha de rede do fetch. */
export function classifyError(error: unknown): AppErrorKind {
  const { status, code } = (error ?? {}) as { status?: unknown; code?: unknown };
  if (typeof status !== "number") return error instanceof TypeError ? "NETWORK" : "UNKNOWN";
  if (status === 401) return "SESSION_EXPIRED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  if (status === 503) return code === "MAINTENANCE" ? "MAINTENANCE" : "DATABASE";
  if (status >= 500) return "SERVER";
  if (status >= 400) return "INVALID";
  return "UNKNOWN";
}
