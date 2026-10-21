import { useCallback } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useTranslation } from "next-i18next/pages";
import { toast } from "sonner";
import { APP_ERRORS, appErrorChannel, classifyError } from "@/models/domain/appErrors";
import { channelsOf, type SecurityEventType } from "@/models/domain/securityEvents";
import { useCriticalErrorStore } from "./stores/criticalErrorStore";

export const NOTICES_KEY = ["notices"] as const;

/**
 * Ponto único das notificações de segurança no cliente (FN-001): o canal vem do catálogo.
 * Informativo → toast; atenção/crítico já foram gravados pelo servidor → recarrega os avisos.
 */
export function notifyClient(qc: QueryClient, t: TFunction, type: SecurityEventType) {
  const channels = channelsOf(type);
  if (channels.includes("toast")) toast.info(t(`common:security.toast.${type}`));
  if (channels.includes("banner")) qc.invalidateQueries({ queryKey: NOTICES_KEY });
}

export function useNotify() {
  const qc = useQueryClient();
  const { t } = useTranslation("common");
  return useCallback((type: SecurityEventType) => notifyClient(qc, t, type), [qc, t]);
}

/** Erros já avisados (o handler global e o da tela podem receber o mesmo erro). */
const handled = new WeakSet<object>();

/**
 * Ponto único dos erros no cliente, no mesmo padrão: a gravidade decide o canal.
 * Graves (rede, banco, servidor, acesso negado, sessão) → alerta fixo na tela;
 * atenção (muitas tentativas) → notificação de alerta; leves → notificação com a mensagem.
 */
export function notifyErrorClient(t: TFunction, error: unknown, fallback?: string) {
  if (typeof error === "object" && error !== null) {
    if (handled.has(error)) return;
    handled.add(error);
  }
  const kind = classifyError(error);
  if (appErrorChannel(kind) === "alert") {
    useCriticalErrorStore.getState().show(kind);
    return;
  }
  if (APP_ERRORS[kind] === "ATTENTION") {
    toast.warning(t(`common:errors.${kind}.title`), { duration: 8000 });
    return;
  }
  const message = error instanceof Error && error.message ? error.message : (fallback ?? t("common:errors.UNKNOWN.title"));
  toast.error(fallback && kind !== "CONFLICT" ? `${fallback}: ${message}` : message);
}

export function useNotifyError() {
  const { t } = useTranslation("common");
  return useCallback((error: unknown, fallback?: string) => notifyErrorClient(t, error, fallback), [t]);
}
