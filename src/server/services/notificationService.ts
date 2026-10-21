import {
  channelsOf,
  isNoticeEvent,
  severityOf,
  type NoticeEventType,
  type NoticeParams,
  type SecurityNotice,
} from "@/models/domain/securityEvents";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";

export interface SecurityEvent {
  type: NoticeEventType;
  userId: string;
  params?: NoticeParams;
  /** Sessão que causou o evento (só o "novo login" usa). */
  originSessionId?: string;
}

/**
 * Ponto único das notificações de segurança no servidor (FN-001, FN-002): o canal vem do
 * catálogo pela gravidade do evento. Atenção e crítico → aviso persistente no app.
 * Os eventos informativos (toast) são só do cliente (src/viewmodels/useNotify.ts).
 */
export async function notify(event: SecurityEvent) {
  const channels = channelsOf(event.type);
  if (channels.includes("banner")) await openNotice(event);
}

const pending = new Set<Promise<void>>();

/**
 * Dispara sem esperar: usado nas falhas de login, para o tempo de resposta não revelar se a
 * conta existe. Um erro aqui nunca derruba a requisição.
 */
export function notifyInBackground(event: SecurityEvent) {
  const job = notify(event)
    .catch((e) => console.error("[notify]", event.type, e))
    .finally(() => pending.delete(job));
  pending.add(job);
}

/** Espera os avisos disparados em segundo plano (testes: antes de limpar o banco). */
export async function flushNotifications() {
  while (pending.size) await Promise.all([...pending]);
}

/** Um aviso aberto por tipo: um evento repetido atualiza o aviso em vez de empilhar outro. */
async function openNotice({ type, userId, params, originSessionId }: SecurityEvent) {
  const data = { params: params ? JSON.stringify(params) : null, originSessionId: originSessionId ?? null };
  const open = await prisma.securityNotice.findFirst({ where: { userId, type, dismissedAt: null } });
  if (open) await prisma.securityNotice.update({ where: { id: open.id }, data: { ...data, createdAt: new Date() } });
  else await prisma.securityNotice.create({ data: { userId, type, ...data } });
}

/**
 * Avisos abertos do usuário, do mais recente ao mais antigo. O "novo login" só aparece nas
 * outras sessões, e só se aconteceu depois de esta sessão começar.
 */
export async function listNotices(userId: string, session: { sid?: string; loginAt?: string }): Promise<SecurityNotice[]> {
  const rows = await prisma.securityNotice.findMany({ where: { userId, dismissedAt: null }, orderBy: { createdAt: "desc" } });
  const loginAt = session.loginAt ? new Date(session.loginAt) : null;
  const seen = new Set<string>();
  return rows
    // Tipos que saíram do catálogo (ex.: avisos de conta de jogador) não aparecem.
    .filter((r) => isNoticeEvent(r.type))
    .filter((r) => r.type !== "NEW_LOGIN" || (r.originSessionId !== session.sid && !!loginAt && r.createdAt >= loginAt))
    .filter((r) => !seen.has(r.type) && !!seen.add(r.type))
    .map((r) => {
      const type = r.type as NoticeEventType;
      return {
        id: r.id,
        type,
        severity: severityOf(type) as SecurityNotice["severity"],
        params: r.params ? (JSON.parse(r.params) as NoticeParams) : {},
        createdAt: r.createdAt.toISOString(),
      };
    });
}

export async function dismissNotice(userId: string, id: string) {
  const { count } = await prisma.securityNotice.updateMany({ where: { id, userId, dismissedAt: null }, data: { dismissedAt: new Date() } });
  if (count === 0) throw new HttpError(404, "NOT_FOUND", "Aviso não encontrado");
}
